"""
Image Lab Orchestrator v7.0 – جودة صورة ممتازة
=============================================
- طبقة 1: Gemini Image (أساسي - أفضل جودة)
- طبقة 2: Pollinations Flux (احتياطي 1 - جودة عالية جداً)
- طبقة 3: HuggingFace Stable Diffusion (احتياطي 2 - جودة عالية)
- طبقة 4: Pollinations Default (احتياطي نهائي)
"""
import logging, os, base64, aiohttp, asyncio
from typing import Dict, Any

logger = logging.getLogger(__name__)

HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY", "")
HF_SD_MODEL = "stabilityai/stable-diffusion-xl-base-1.0"
# HF_SD_MODEL = "stabilityai/stable-diffusion-2-1"

class ImageOrchestrator:
    async def generate(self, user_id: str, prompt: str, style: str = "realistic", size: str = "1024x1024") -> Dict[str, Any]:
        
        # تحسين النص بإضافة كلمات الجودة وترجمته
        enhanced_prompt = self._enhance_prompt(prompt, style)
        
        # 1. Gemini Image (أساسي)
        try:
            logger.info(f"🎨 Trying Gemini Image for: {enhanced_prompt[:50]}")
            from app.infrastructure.ai.ai_gateway import ai_gateway
            key = ai_gateway.key_manager.get_key("gemini_image")
            if key:
                from google import genai
                client = genai.Client(api_key=key)
                loop = asyncio.get_running_loop()
                
                # إعادة المحاولة بنص محسن إذا فشلت الأولى
                for attempt in range(2):
                    current_prompt = enhanced_prompt if attempt == 0 else f"Generate a masterpiece, highly detailed, 4k resolution image: {prompt}"
                    try:
                        response = await asyncio.wait_for(
                            loop.run_in_executor(None, lambda: client.models.generate_content(
                                model="gemini-2.5-flash-exp-image-generation",
                                contents=current_prompt
                            )),
                            timeout=30.0
                        )
                        if response and response.text:
                            return {"status": "success", "image_url": response.text, "provider": "gemini", "prompt_used": current_prompt}
                    except Exception as e:
                        logger.warning(f"Gemini attempt {attempt + 1} failed: {e}")
        except Exception as e:
            logger.warning(f"Gemini Image failed: {e}")

        # 2. Pollinations Flux (جودة عالية جداً)
        try:
            logger.info(f"🎨 Trying Pollinations Flux for: {enhanced_prompt[:50]}")
            encoded_prompt = enhanced_prompt.replace(" ", "%20")
            
            # تجربة أحجام مختلفة حسب الطلب
            width, height = self._parse_size(size)
            
            url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true&model=flux&enhance=true"
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                    if resp.status_code == 200:
                        image_bytes = await resp.read()
                        image_base64 = base64.b64encode(image_bytes).decode("utf-8")
                        return {"status": "success", "image_url": f"data:image/png;base64,{image_base64}", "provider": "pollinations_flux"}
        except Exception as e:
            logger.warning(f"Pollinations Flux failed: {e}")

        # 3. HuggingFace Stable Diffusion
        if HF_API_KEY:
            try:
                logger.info(f"🎨 Trying Stable Diffusion for: {enhanced_prompt[:50]}")
                headers = {"Authorization": f"Bearer {HF_API_KEY}"}
                # إضافة negative prompt لتحسين الجودة
                payload = {
                    "inputs": enhanced_prompt,
                    "parameters": {
                        "negative_prompt": "ugly, blurry, low quality, distorted",
                        "num_inference_steps": 30,
                        "guidance_scale": 7.5
                    }
                }
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"https://api-inference.huggingface.co/models/{HF_SD_MODEL}",
                        headers=headers, json=payload, timeout=aiohttp.ClientTimeout(total=30)
                    ) as resp:
                        if resp.status_code == 200:
                            image_bytes = await resp.read()
                            image_base64 = base64.b64encode(image_bytes).decode("utf-8")
                            return {"status": "success", "image_url": f"data:image/png;base64,{image_base64}", "provider": "huggingface_sd"}
            except Exception as e:
                logger.warning(f"Stable Diffusion failed: {e}")

        # 4. Pollinations Default (احتياطي نهائي)
        try:
            logger.info(f"🎨 Trying Pollinations Default for: {prompt[:50]}")
            encoded_prompt = prompt.replace(" ", "%20")
            width, height = self._parse_size(size)
            url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true"
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                    if resp.status_code == 200:
                        image_bytes = await resp.read()
                        image_base64 = base64.b64encode(image_bytes).decode("utf-8")
                        return {"status": "success", "image_url": f"data:image/png;base64,{image_base64}", "provider": "pollinations"}
        except Exception as e:
            logger.warning(f"Pollinations failed: {e}")

        return {"status": "fallback", "message": "عذراً، فشل توليد الصورة.", "provider": "none"}

    def _enhance_prompt(self, prompt: str, style: str) -> str:
        """تحسين النص للحصول على أفضل جودة"""
        quality_keywords = "masterpiece, best quality, 4k, highly detailed, sharp focus"
        style_keywords = {
            "realistic": "photorealistic, hyperrealistic, professional photography, 8k",
            "anime": "anime style, studio ghibli, key visual, vibrant",
            "oil_painting": "oil painting, textured, artistic, classic",
            "pixel_art": "pixel art, 8-bit, retro, game art",
            "digital_art": "digital art, artstation, concept art, trending",
            "3d_render": "3d render, octane render, cinema 4d, blender",
            "fantasy": "fantasy art, epic, magical, detailed fantasy",
            "cyberpunk": "cyberpunk, neon, futuristic, blade runner style",
            "noir": "noir, black and white, film noir, dramatic lighting",
            "watercolor": "watercolor painting, artistic, soft, flowing",
            "architecture": "architectural visualization, modern architecture, professional",
            "portrait": "portrait photography, professional lighting, bokeh",
        }
        
        style_addition = style_keywords.get(style, "high quality")
        
        enhanced = f"{prompt}, {style_addition}, {quality_keywords}"
        return enhanced

    def _parse_size(self, size: str) -> tuple:
        """تحويل الحجم النصي إلى أبعاد"""
        sizes = {
            "1024x1024": (1024, 1024),
            "768x1024": (768, 1024),
            "1024x768": (1024, 768),
            "1280x720": (1280, 720),
        }
        return sizes.get(size, (1024, 1024))

image_lab = ImageOrchestrator()
logger.info("✅ Image Lab v7.0 initialized (Gemini → Flux → SD → Pollinations)")
