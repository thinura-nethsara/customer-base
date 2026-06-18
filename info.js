const axios = require("axios");

module.exports = (register) => {
  // Hardcoded API Keys
  const thinuzzKey = "key_faa62e4037a95cda"; // Mr Thinuzz API Key
  const geminiKey = process.env.GEMINI_API_KEY; // Still use env for Gemini

  // Helper function to extract audio URL from different response formats
  const extractAudioUrl = (data) => {
    return data?.data?.links?.audio || 
           data?.result?.download_url || 
           data?.download_url || 
           data?.audio_url ||
           data?.url;
  };

  // Helper function to extract video URL from different response formats
  const extractVideoUrl = (data) => {
    return data?.data?.links?.video || 
           data?.data?.links?.download ||
           data?.result?.download_url || 
           data?.download_url || 
           data?.video_url ||
           data?.url;
  };

  // Helper function to extract title from different response formats
  const extractTitle = (data) => {
    return data?.data?.title || 
           data?.result?.title || 
           data?.title || 
           "Media";
  };

  register("song", "Extract MP3 from YouTube", "Info", async (ctx) => {
    const query = ctx.args.join(" ");
    if (!query) return ctx.reply("❌ Please provide a YouTube URL or search query.");
    
    await ctx.reply("⏳ *Processing YouTube audio extraction...*");
    
    try {
      const apiUrl = `https://mr-thinuzz-api-build.vercel.app/api/ytmp3/download?url=${encodeURIComponent(query)}&apiKey=${thinuzzKey}`;
      console.log("🔍 Calling API:", apiUrl);
      
      const res = await axios.get(apiUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log("📦 API Response:", JSON.stringify(res.data, null, 2));
      
      if (res.data?.status) {
        const audioUrl = extractAudioUrl(res.data);
        const title = extractTitle(res.data);
        
        if (audioUrl) {
          await ctx.sock.sendMessage(ctx.jid, { 
            audio: { url: audioUrl }, 
            mimetype: 'audio/mpeg4',
            fileName: `${title}.mp3`,
            caption: `🎵 *${title}*\n✅ Download Successful!`
          }, { quoted: ctx.msg });
        } else {
          ctx.reply("❌ No audio link found in API response");
        }
      } else {
        const errorMsg = res.data?.message || res.data?.error || "Unknown error";
        ctx.reply(`❌ Extraction failed: ${errorMsg}`);
      }
    } catch (e) {
      console.error("❌ Song download error:", e.message);
      
      if (e.code === 'ECONNABORTED') {
        ctx.reply("❌ Request timeout. Please try again.");
      } else if (e.response) {
        const status = e.response.status;
        const statusMessages = {
          400: "❌ Invalid YouTube URL. Please check and try again.",
          401: "❌ API authentication failed.",
          403: "❌ Access denied. Please try again later.",
          404: "❌ Video not found or unavailable.",
          429: "❌ Rate limit exceeded. Please wait and try again.",
          500: "❌ Server error. Please try again later."
        };
        ctx.reply(statusMessages[status] || `❌ Server error (${status})`);
      } else {
        ctx.reply(`❌ Download failed: ${e.message}`);
      }
    }
  });

  register("mp4", "Download high speed YouTube videos", "Info", async (ctx) => {
    const query = ctx.args.join(" ");
    if (!query) return ctx.reply("❌ Provide a valid YouTube video link.");
    
    await ctx.reply("⏳ *Buffering 720p HD stream output...*");
    
    try {
      const apiUrl = `https://mr-thinuzz-api-build.vercel.app/api/ytmp4v2/download?url=${encodeURIComponent(query)}&quality=720&apiKey=${thinuzzKey}`;
      console.log("🔍 Calling API:", apiUrl);
      
      const res = await axios.get(apiUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log("📦 API Response:", JSON.stringify(res.data, null, 2));
      
      if (res.data?.status) {
        const videoUrl = extractVideoUrl(res.data);
        const title = extractTitle(res.data);
        
        if (videoUrl) {
          await ctx.sock.sendMessage(ctx.jid, { 
            video: { url: videoUrl }, 
            caption: `🎬 *${title}*\n✅ Download Successful!`,
            fileName: `${title}.mp4`
          }, { quoted: ctx.msg });
        } else {
          ctx.reply("❌ No video link found in API response");
        }
      } else {
        const errorMsg = res.data?.message || res.data?.error || "Unknown error";
        ctx.reply(`❌ Video extraction failed: ${errorMsg}`);
      }
    } catch (e) {
      console.error("❌ Video download error:", e.message);
      ctx.reply(`❌ API pipeline error: ${e.message}`);
    }
  });

  register("fb", "Extract Facebook video frames", "Info", async (ctx) => {
    const query = ctx.args.join(" ");
    if (!query) return ctx.reply("❌ Facebook video link required.");
    
    await ctx.reply("⏳ *Analyzing Facebook CDN profiles...*");
    
    try {
      const apiUrl = `https://www.movanest.xyz/v2/fbdown?url=${encodeURIComponent(query)}`;
      console.log("🔍 Calling API:", apiUrl);
      
      const res = await axios.get(apiUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log("📦 API Response:", JSON.stringify(res.data, null, 2));
      
      // Check different possible response structures for Facebook
      const videoUrl = res.data?.result?.sd || 
                       res.data?.result?.hd || 
                       res.data?.sd || 
                       res.data?.hd ||
                       res.data?.video_url ||
                       res.data?.url;
      
      if (videoUrl) {
        await ctx.sock.sendMessage(ctx.jid, { 
          video: { url: videoUrl }, 
          caption: "🎬 Facebook Video Download Successful!"
        }, { quoted: ctx.msg });
      } else {
        ctx.reply("❌ Media parsing failed. Could not extract video URL.");
      }
    } catch (e) {
      console.error("❌ Facebook download error:", e.message);
      ctx.reply(`❌ Server Exception: ${e.message}`);
    }
  });

  register("tt", "Download TikTok formats without tracking tag", "Info", async (ctx) => {
    const query = ctx.args.join(" ");
    if (!query) return ctx.reply("❌ TikTok video link required.");
    
    await ctx.reply("⏳ *Downloading TikTok video data block...*");
    
    try {
      const apiUrl = `https://mr-thinuzz-api-build.vercel.app/api/tiktok?url=${encodeURIComponent(query)}&apiKey=${thinuzzKey}`;
      console.log("🔍 Calling API:", apiUrl);
      
      const res = await axios.get(apiUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log("📦 API Response:", JSON.stringify(res.data, null, 2));
      
      if (res.data?.status) {
        const videoUrl = extractVideoUrl(res.data);
        const title = extractTitle(res.data);
        
        if (videoUrl) {
          await ctx.sock.sendMessage(ctx.jid, { 
            video: { url: videoUrl }, 
            caption: `🎵 *${title || 'TikTok Video'}*\n✅ Download Successful!`
          }, { quoted: ctx.msg });
        } else {
          ctx.reply("❌ No video link found in API response");
        }
      } else {
        const errorMsg = res.data?.message || res.data?.error || "Unknown error";
        ctx.reply(`❌ TikTok download failed: ${errorMsg}`);
      }
    } catch (e) {
      console.error("❌ TikTok download error:", e.message);
      ctx.reply(`❌ Error: ${e.message}`);
    }
  });

  register("insta", "Download Instagram Reels arrays", "Info", async (ctx) => {
    const query = ctx.args.join(" ");
    if (!query) return ctx.reply("❌ Instagram Reel/Post link required.");
    
    await ctx.reply("⏳ *Acquiring Instagram target resource...*");
    
    try {
      const apiUrl = `https://mr-thinuzz-api-build.vercel.app/api/instadown/download?url=${encodeURIComponent(query)}&apiKey=${thinuzzKey}`;
      console.log("🔍 Calling API:", apiUrl);
      
      const res = await axios.get(apiUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log("📦 API Response:", JSON.stringify(res.data, null, 2));
      
      if (res.data?.status) {
        const videoUrl = extractVideoUrl(res.data);
        const title = extractTitle(res.data);
        
        if (videoUrl) {
          await ctx.sock.sendMessage(ctx.jid, { 
            video: { url: videoUrl }, 
            caption: `📸 *${title || 'Instagram Post'}*\n✅ Download Successful!`
          }, { quoted: ctx.msg });
        } else {
          // Try to get image if video not available
          const imageUrl = res.data?.data?.links?.image || 
                          res.data?.result?.image_url ||
                          res.data?.image_url;
          
          if (imageUrl) {
            await ctx.sock.sendMessage(ctx.jid, { 
              image: { url: imageUrl }, 
              caption: `📸 *${title || 'Instagram Post'}*\n✅ Download Successful!`
            }, { quoted: ctx.msg });
          } else {
            ctx.reply("❌ No media link found in API response");
          }
        }
      } else {
        const errorMsg = res.data?.message || res.data?.error || "Unknown error";
        ctx.reply(`❌ Instagram download failed: ${errorMsg}`);
      }
    } catch (e) {
      console.error("❌ Instagram download error:", e.message);
      ctx.reply(`❌ Connection drop: ${e.message}`);
    }
  });

  register("ai", "Inquire processing with native Gemini AI Studio Pro", "Info", async (ctx) => {
    const prompt = ctx.args.join(" ");
    if (!prompt) return ctx.reply("❌ Please provide a prompt for the AI.");
    
    if (!geminiKey) {
      console.error("❌ GEMINI_API_KEY not set");
      return ctx.reply("❌ AI service configuration error.");
    }

    await ctx.reply("🤖 *Thinking...*");
    
    try {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          contents: [{ 
            parts: [{ text: prompt }] 
          }]
        },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        // Split long messages if needed (WhatsApp has 4096 char limit)
        if (text.length > 4000) {
          const chunks = text.match(/.{1,4000}/g) || [];
          for (const chunk of chunks) {
            await ctx.reply(chunk);
          }
        } else {
          await ctx.reply(text.trim());
        }
      } else {
        ctx.reply("❌ No response generated by AI");
      }
    } catch (e) {
      console.error("❌ AI Error:", e.message);
      
      if (e.response) {
        const errorMsg = e.response.data?.error?.message || e.message;
        ctx.reply(`❌ AI Engine error: ${errorMsg}`);
      } else {
        ctx.reply(`❌ AI Engine processing down: ${e.message}`);
      }
    }
  });
};
