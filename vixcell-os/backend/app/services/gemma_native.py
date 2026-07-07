"""
Gemma Native Service - استخدام كود مكتبة Gemma المدمجة مباشرة في المشروع.
تم نسخ مكتبة Gemma JAX من المسار المُنزل لتصبح جزءاً من كود برمجة الموقع المصدري.
"""
import os
import sys
import logging
from typing import Optional

# إضافة مسار السيرفر الخلفي للتأكد من إمكانية استيراد حزمة gemma بشكل صحيح
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

logger = logging.getLogger(__name__)

# محاولة استيراد مكتبة Gemma المدمجة
try:
    from gemma import gm
    GEMMA_CODE_AVAILABLE = True
    logger.info("✅ تم العثور على مكتبة Gemma المدمجة في الكود بنجاح!")
except ImportError as e:
    GEMMA_CODE_AVAILABLE = False
    logger.warning(f"⚠️ لم يتم العثور على مكتبة gemma أو مكتبات JAX المطلوبة: {e}")


class GemmaNativeService:
    """
    متحكم لنموذج Gemma المدمج محلياً في الكود المصدري للمشروع.
    تستخدم هذه الفئة كود مكتبة Gemma (JAX) لتحميل الأوزان محلياً وتوليد النصوص.
    """

    def __init__(self, checkpoint_path: Optional[str] = None):
        self.checkpoint_path = checkpoint_path or os.getenv("GEMMA_CHECKPOINT_PATH", "")
        self.sampler = None
        self.model = None
        self.params = None

    def is_available(self) -> bool:
        """التحقق مما إذا كانت ملفات تشغيل Gemma وJAX منصبة بالكامل."""
        return GEMMA_CODE_AVAILABLE

    def initialize_model(self, model_type: str = "Gemma4_E4B") -> bool:
        """
        تهيئة النموذج وتحميل الأوزان (Weights) المخصصة للـ JAX.
        يتطلب ذلك أن تكون مكتبة JAX مثبتة وملفات الأوزان محملة.
        """
        if not GEMMA_CODE_AVAILABLE:
            logger.error("مكتبة Gemma المدمجة غير متاحة أو حزم JAX ناقصة.")
            return False

        if not self.checkpoint_path or not os.path.exists(self.checkpoint_path):
            logger.error(
                f"❌ لم يتم العثور على ملفات الأوزان في المسار المخصص: {self.checkpoint_path}\n"
                "يرجى تعيين مسار الأوزان في متغير البيئة GEMMA_CHECKPOINT_PATH"
            )
            return False

        try:
            logger.info(f"جاري تهيئة نموذج Gemma محلياً بنوع: {model_type}...")
            
            # تهيئة المعمارية بناءً على النوع المختار
            if model_type == "Gemma4_E4B":
                self.model = gm.nn.Gemma4_E4B()
            else:
                # بشكل افتراضي نستخدم المعمارية الأساسية لـ Gemma 2B/9B JAX
                self.model = gm.nn.Gemma2_2B() if "2b" in model_type.lower() else gm.nn.Gemma2_9B()

            logger.info("جاري تحميل الأوزان والمعاملات (Parameters)...")
            self.params = gm.ckpts.load_params(self.checkpoint_path)

            logger.info("جاري إعداد عينات المحادثة (Chat Sampler)...")
            self.sampler = gm.text.ChatSampler(
                model=self.model,
                params=self.params,
                multi_turn=True
            )
            logger.info("✅ تم تهيئة نموذج Gemma المدمج بنجاح!")
            return True
        except Exception as e:
            logger.error(f"فشل إعداد النموذج المدمج Gemma JAX: {e}")
            return False

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> Optional[str]:
        """
        توليد إجابة على النص المدخل باستخدام كود Gemma المدمج محلياً.
        """
        if not self.sampler:
            logger.warning("النموذج غير مهيأ بعد. يرجى تهيئته عن طريق initialize_model() وتحديد مسار الأوزان.")
            return None

        try:
            full_prompt = f"{system_prompt}\n\nUser: {prompt}" if system_prompt else prompt
            logger.info("جاري الاستعلام من نموذج Gemma المدمج...")
            response = self.sampler.chat(full_prompt)
            return response
        except Exception as e:
            logger.error(f"خطأ أثناء استعلام نموذج Gemma المدمج: {e}")
            return None
