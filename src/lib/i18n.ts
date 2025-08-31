import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      features: "Features",
      reviews: "Reviews", 
      security: "Security",
      blog: "Blog",
      pricing: "Pricing",
      signIn: "Sign In",
      getStarted: "Get Started",
      
      // Landing Page Hero
      trustedBy: "🚀 Trusted by 15,000+ creators and brands",
      heroTitle: "Get Paid Instantly for Your",
      heroTitleHighlight: "Creator Work",
      heroDescription: "Secure escrow platform that protects both creators and brands. Funds release automatically when work is approved - no more payment delays.",
      startCreatingDeals: "Start Creating Deals",
      watchDemo: "Watch Demo",
      
      // Stats
      paidToCreators: "Paid to Creators",
      successfulDeals: "Successful Deals", 
      paymentSuccessRate: "Payment Success Rate",
      averagePayoutTime: "Average Payout Time",
      
      // Features
      featuresTitle: "Why Creators & Brands Choose FlowPay",
      featuresDescription: "Built specifically for the creator economy with features that protect everyone involved",
      secureEscrow: "Secure Escrow",
      secureEscrowDesc: "Your funds are protected with bank-grade security until deliverables are approved.",
      instantPayouts: "Instant Payouts", 
      instantPayoutsDesc: "Creators get paid immediately upon approval - no more waiting 30 days for payment.",
      stripeProtected: "Stripe Protected",
      stripeProtectedDesc: "All payments processed through Stripe with buyer and seller protection.",
      autoRelease: "Auto-Release",
      autoReleaseDesc: "Payments automatically release if no response within the agreed timeframe.",
      
      // How it works
      howItWorksTitle: "How FlowPay Works",
      howItWorksDescription: "Simple, secure, and transparent",
      step1Title: "Create & Accept Deal",
      step1Description: "Brand creates deal with milestones. Creator reviews and accepts terms.",
      step2Title: "Secure Funding", 
      step2Description: "Brand funds the escrow. Money is held safely until work is completed.",
      step3Title: "Instant Payment",
      step3Description: "Creator delivers work. Upon approval, payment releases instantly.",
      
      // Reviews
      reviewsTitle: "What Our Users Say",
      reviewsRating: "4.9/5 from 2,500+ reviews",
      
      // Security
      securityTitle: "Bank-Grade Security",
      securityDescription: "Your money and data are protected with the same security standards used by major financial institutions",
      stripeSecured: "Stripe Secured",
      stripeSecuredDesc: "All payments processed through Stripe with PCI DSS Level 1 compliance",
      verifiedUsers: "Verified Users",
      verifiedUsersDesc: "KYC verification ensures all users are legitimate and trustworthy",
      successRate: "99.8% Success Rate",
      successRateDesc: "Proven track record with thousands of successful transactions",
      
      // Guarantee
      guaranteeTitle: "100% Money-Back Guarantee",
      guaranteeDescription: "If you're not completely satisfied with FlowPay within your first 30 days, we'll refund every penny. No questions asked.",
      dayGuarantee: "30-day guarantee",
      noQuestionsAsked: "No questions asked",
      fullRefund: "Full refund",
      
      // CTA
      ctaTitle: "Ready to Get Paid Instantly?",
      ctaDescription: "Join thousands of creators and brands who trust FlowPay for secure, instant payments",
      startFreeToday: "Start Free Today",
      noSetupFees: "No setup fees • No monthly fees • Only pay when you get paid",
      moneyBackGuarantee: "30-day money-back guarantee",
      
      // Auth
      welcomeBack: "Welcome Back",
      joinFlowPay: "Join FlowPay", 
      signInToAccount: "Sign in to your FlowPay account",
      createAccount: "Create your FlowPay account to get started",
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      password: "Password",
      iAm: "I am a...",
      creator: "Creator",
      brand: "Brand",
      createAccountButton: "Create Account",
      signInButton: "Sign In",
      noAccount: "Don't have an account? Sign up",
      hasAccount: "Already have an account? Sign in",
      
      // Dashboard
      welcomeBackCreator: "Welcome back, {{name}}! Ready to deliver amazing content?",
      welcomeBackBrand: "Welcome back, {{name}}! Let's create some great partnerships.",
      welcomeBackAdmin: "Welcome back, {{name}}! Here's your admin overview.",
      totalDeals: "Total Deals",
      activeDeals: "Active Deals", 
      totalValue: "Total Value",
      completed: "Completed",
      recentDeals: "Recent Deals",
      allTimePartnerships: "All-time partnerships",
      currentlyFunded: "Currently funded",
      acrossAllDeals: "Across all deals",
      successfullyReleased: "Successfully released",
      
      // Pricing
      choosePlan: "Choose Your Plan",
      pricingDescription: "Start free, then choose a plan that scales with your business",
      monthly: "Monthly",
      yearly: "Yearly", 
      save17: "Save 17%",
      currentPlan: "Currently on {{plan}} plan",
      mostPopular: "Most Popular",
      currentPlanBadge: "Current Plan",
      
      // Common
      loading: "Loading...",
      cancel: "Cancel",
      save: "Save",
      edit: "Edit",
      delete: "Delete",
      continue: "Continue",
      back: "Back",
      next: "Next",
      submit: "Submit",
      close: "Close",
    }
  },
  es: {
    translation: {
      // Navigation
      features: "Características",
      reviews: "Reseñas",
      security: "Seguridad",
      blog: "Blog",
      pricing: "Precios",
      signIn: "Iniciar Sesión",
      getStarted: "Comenzar",
      
      // Landing Page Hero
      trustedBy: "🚀 Confiado por 15,000+ creadores y marcas",
      heroTitle: "Recibe Pagos Instantáneos por tu",
      heroTitleHighlight: "Trabajo Creativo",
      heroDescription: "Plataforma de depósito segura que protege tanto a creadores como marcas. Los fondos se liberan automáticamente cuando el trabajo es aprobado - no más retrasos en pagos.",
      startCreatingDeals: "Comenzar a Crear Acuerdos",
      watchDemo: "Ver Demo",
      
      // Stats
      paidToCreators: "Pagado a Creadores",
      successfulDeals: "Acuerdos Exitosos",
      paymentSuccessRate: "Tasa de Éxito de Pagos", 
      averagePayoutTime: "Tiempo Promedio de Pago",
      
      // Features
      featuresTitle: "Por Qué Creadores y Marcas Eligen FlowPay",
      featuresDescription: "Construido específicamente para la economía de creadores con características que protegen a todos los involucrados",
      secureEscrow: "Depósito Seguro",
      secureEscrowDesc: "Tus fondos están protegidos con seguridad bancaria hasta que los entregables sean aprobados.",
      instantPayouts: "Pagos Instantáneos",
      instantPayoutsDesc: "Los creadores reciben pagos inmediatamente tras aprobación - no más espera de 30 días.",
      stripeProtected: "Protegido por Stripe",
      stripeProtectedDesc: "Todos los pagos procesados a través de Stripe con protección para compradores y vendedores.",
      autoRelease: "Liberación Automática",
      autoReleaseDesc: "Los pagos se liberan automáticamente si no hay respuesta en el tiempo acordado.",
      
      // How it works
      howItWorksTitle: "Cómo Funciona FlowPay",
      howItWorksDescription: "Simple, seguro y transparente",
      step1Title: "Crear y Aceptar Acuerdo",
      step1Description: "La marca crea el acuerdo con hitos. El creador revisa y acepta términos.",
      step2Title: "Financiamiento Seguro",
      step2Description: "La marca financia el depósito. El dinero se mantiene seguro hasta completar el trabajo.",
      step3Title: "Pago Instantáneo",
      step3Description: "El creador entrega el trabajo. Tras aprobación, el pago se libera instantáneamente.",
      
      // Reviews
      reviewsTitle: "Lo Que Dicen Nuestros Usuarios",
      reviewsRating: "4.9/5 de 2,500+ reseñas",
      
      // Security
      securityTitle: "Seguridad de Nivel Bancario",
      securityDescription: "Tu dinero y datos están protegidos con los mismos estándares de seguridad usados por instituciones financieras principales",
      stripeSecured: "Asegurado por Stripe",
      stripeSecuredDesc: "Todos los pagos procesados a través de Stripe con cumplimiento PCI DSS Nivel 1",
      verifiedUsers: "Usuarios Verificados",
      verifiedUsersDesc: "La verificación KYC asegura que todos los usuarios sean legítimos y confiables",
      successRate: "99.8% Tasa de Éxito",
      successRateDesc: "Historial probado con miles de transacciones exitosas",
      
      // Guarantee  
      guaranteeTitle: "Garantía de Devolución del 100%",
      guaranteeDescription: "Si no estás completamente satisfecho con FlowPay en tus primeros 30 días, te devolveremos cada centavo. Sin preguntas.",
      dayGuarantee: "Garantía de 30 días",
      noQuestionsAsked: "Sin preguntas",
      fullRefund: "Reembolso completo",
      
      // CTA
      ctaTitle: "¿Listo para Recibir Pagos Instantáneos?",
      ctaDescription: "Únete a miles de creadores y marcas que confían en FlowPay para pagos seguros e instantáneos",
      startFreeToday: "Comenzar Gratis Hoy",
      noSetupFees: "Sin tarifas de configuración • Sin tarifas mensuales • Solo paga cuando te paguen",
      moneyBackGuarantee: "Garantía de devolución de 30 días",
      
      // Auth
      welcomeBack: "Bienvenido de Vuelta",
      joinFlowPay: "Únete a FlowPay",
      signInToAccount: "Inicia sesión en tu cuenta FlowPay",
      createAccount: "Crea tu cuenta FlowPay para comenzar",
      firstName: "Nombre",
      lastName: "Apellido",
      email: "Correo Electrónico",
      password: "Contraseña",
      iAm: "Soy un...",
      creator: "Creador",
      brand: "Marca",
      createAccountButton: "Crear Cuenta",
      signInButton: "Iniciar Sesión",
      noAccount: "¿No tienes cuenta? Regístrate",
      hasAccount: "¿Ya tienes cuenta? Inicia sesión",
      
      // Dashboard
      welcomeBackCreator: "¡Bienvenido de vuelta, {{name}}! ¿Listo para crear contenido increíble?",
      welcomeBackBrand: "¡Bienvenido de vuelta, {{name}}! Creemos algunas asociaciones geniales.",
      welcomeBackAdmin: "¡Bienvenido de vuelta, {{name}}! Aquí está tu resumen administrativo.",
      totalDeals: "Total de Acuerdos",
      activeDeals: "Acuerdos Activos",
      totalValue: "Valor Total", 
      completed: "Completados",
      recentDeals: "Acuerdos Recientes",
      allTimePartnerships: "Asociaciones de todos los tiempos",
      currentlyFunded: "Actualmente financiados",
      acrossAllDeals: "En todos los acuerdos",
      successfullyReleased: "Liberados exitosamente",
      
      // Pricing
      choosePlan: "Elige Tu Plan",
      pricingDescription: "Comienza gratis, luego elige un plan que escale con tu negocio",
      monthly: "Mensual",
      yearly: "Anual",
      save17: "Ahorra 17%",
      currentPlan: "Actualmente en plan {{plan}}",
      mostPopular: "Más Popular",
      currentPlanBadge: "Plan Actual",
      
      // Common
      loading: "Cargando...",
      cancel: "Cancelar",
      save: "Guardar",
      edit: "Editar",
      delete: "Eliminar",
      continue: "Continuar",
      back: "Atrás",
      next: "Siguiente",
      submit: "Enviar",
      close: "Cerrar",
    }
  },
  zh: {
    translation: {
      // Navigation
      features: "功能",
      reviews: "评价",
      security: "安全",
      blog: "博客",
      pricing: "定价",
      signIn: "登录",
      getStarted: "开始使用",
      
      // Landing Page Hero
      trustedBy: "🚀 受到15,000+创作者和品牌信任",
      heroTitle: "为您的创作工作",
      heroTitleHighlight: "获得即时付款",
      heroDescription: "安全的托管平台，保护创作者和品牌双方。工作获得批准后资金自动释放 - 不再有付款延迟。",
      startCreatingDeals: "开始创建交易",
      watchDemo: "观看演示",
      
      // Stats
      paidToCreators: "支付给创作者",
      successfulDeals: "成功交易",
      paymentSuccessRate: "付款成功率",
      averagePayoutTime: "平均付款时间",
      
      // Features
      featuresTitle: "为什么创作者和品牌选择FlowPay",
      featuresDescription: "专为创作者经济构建，具有保护所有参与者的功能",
      secureEscrow: "安全托管",
      secureEscrowDesc: "您的资金受到银行级安全保护，直到可交付成果获得批准。",
      instantPayouts: "即时付款",
      instantPayoutsDesc: "创作者在获得批准后立即获得付款 - 不再等待30天付款。",
      stripeProtected: "Stripe保护",
      stripeProtectedDesc: "所有付款通过Stripe处理，为买家和卖家提供保护。",
      autoRelease: "自动释放",
      autoReleaseDesc: "如果在约定时间内没有回应，付款会自动释放。",
      
      // How it works
      howItWorksTitle: "FlowPay如何工作",
      howItWorksDescription: "简单、安全、透明",
      step1Title: "创建和接受交易",
      step1Description: "品牌创建带里程碑的交易。创作者审查并接受条款。",
      step2Title: "安全资助",
      step2Description: "品牌为托管提供资金。金钱安全保管直到工作完成。",
      step3Title: "即时付款",
      step3Description: "创作者交付工作。获得批准后，付款立即释放。",
      
      // Reviews
      reviewsTitle: "用户怎么说",
      reviewsRating: "来自2,500+评价的4.9/5",
      
      // Security
      securityTitle: "银行级安全",
      securityDescription: "您的资金和数据受到与主要金融机构相同安全标准的保护",
      stripeSecured: "Stripe保障",
      stripeSecuredDesc: "所有付款通过Stripe处理，符合PCI DSS 1级合规",
      verifiedUsers: "经过验证的用户",
      verifiedUsersDesc: "KYC验证确保所有用户合法可信",
      successRate: "99.8%成功率",
      successRateDesc: "经过验证的记录，拥有数千笔成功交易",
      
      // Guarantee
      guaranteeTitle: "100%退款保证",
      guaranteeDescription: "如果您在前30天内对FlowPay不完全满意，我们将退还每一分钱。无需询问。",
      dayGuarantee: "30天保证",
      noQuestionsAsked: "无需询问",
      fullRefund: "全额退款",
      
      // CTA
      ctaTitle: "准备好获得即时付款了吗？",
      ctaDescription: "加入数千名信任FlowPay进行安全即时付款的创作者和品牌",
      startFreeToday: "今天免费开始",
      noSetupFees: "无设置费用 • 无月费 • 只在您获得付款时付费",
      moneyBackGuarantee: "30天退款保证",
      
      // Auth
      welcomeBack: "欢迎回来",
      joinFlowPay: "加入FlowPay",
      signInToAccount: "登录您的FlowPay账户",
      createAccount: "创建您的FlowPay账户以开始",
      firstName: "名",
      lastName: "姓",
      email: "电子邮件",
      password: "密码",
      iAm: "我是...",
      creator: "创作者",
      brand: "品牌",
      createAccountButton: "创建账户",
      signInButton: "登录",
      noAccount: "没有账户？注册",
      hasAccount: "已有账户？登录",
      
      // Dashboard
      welcomeBackCreator: "欢迎回来，{{name}}！准备好创造精彩内容了吗？",
      welcomeBackBrand: "欢迎回来，{{name}}！让我们创建一些很棒的合作关系。",
      welcomeBackAdmin: "欢迎回来，{{name}}！这是您的管理概览。",
      totalDeals: "总交易数",
      activeDeals: "活跃交易",
      totalValue: "总价值",
      completed: "已完成",
      recentDeals: "最近交易",
      allTimePartnerships: "历史合作伙伴关系",
      currentlyFunded: "当前资助",
      acrossAllDeals: "所有交易",
      successfullyReleased: "成功释放",
      
      // Pricing
      choosePlan: "选择您的计划",
      pricingDescription: "免费开始，然后选择与您业务规模匹配的计划",
      monthly: "月付",
      yearly: "年付",
      save17: "节省17%",
      currentPlan: "当前使用{{plan}}计划",
      mostPopular: "最受欢迎",
      currentPlanBadge: "当前计划",
      
      // Common
      loading: "加载中...",
      cancel: "取消",
      save: "保存", 
      edit: "编辑",
      delete: "删除",
      continue: "继续",
      back: "返回",
      next: "下一步",
      submit: "提交",
      close: "关闭",
    }
  },
  hi: {
    translation: {
      // Navigation
      features: "विशेषताएं",
      reviews: "समीक्षा", 
      security: "सुरक्षा",
      blog: "ब्लॉग",
      pricing: "मूल्य निर्धारण",
      signIn: "साइन इन",
      getStarted: "शुरू करें",
      
      // Landing Page Hero
      trustedBy: "🚀 15,000+ क्रिएटर्स और ब्रांड्स द्वारा विश्वसनीय",
      heroTitle: "अपने क्रिएटिव काम के लिए",
      heroTitleHighlight: "तुरंत पेमेंट पाएं",
      heroDescription: "सुरक्षित एस्क्रो प्लेटफॉर्म जो क्रिएटर्स और ब्रांड्स दोनों की सुरक्षा करता है। काम अप्रूव होने पर फंड अपने आप रिलीज हो जाते हैं - अब पेमेंट में देरी नहीं।",
      startCreatingDeals: "डील बनाना शुरू करें",
      watchDemo: "डेमो देखें",
      
      // Stats
      paidToCreators: "क्रिएटर्स को भुगतान",
      successfulDeals: "सफल सौदे",
      paymentSuccessRate: "भुगतान सफलता दर",
      averagePayoutTime: "औसत भुगतान समय",
      
      // Features
      featuresTitle: "क्रिएटर्स और ब्रांड्स FlowPay क्यों चुनते हैं",
      featuresDescription: "क्रिएटर इकॉनमी के लिए विशेष रूप से बनाया गया, जिसमें सभी शामिल लोगों की सुरक्षा करने वाली विशेषताएं हैं",
      secureEscrow: "सुरक्षित एस्क्रो",
      secureEscrowDesc: "आपके फंड बैंक-ग्रेड सिक्यूरिटी से तब तक सुरक्षित रहते हैं जब तक डिलिवरेबल्स अप्रूव नहीं हो जाते।",
      instantPayouts: "तुरंत भुगतान",
      instantPayoutsDesc: "क्रिएटर्स को अप्रूवल के तुरंत बाद भुगतान मिल जाता है - अब 30 दिन इंतज़ार नहीं।",
      stripeProtected: "स्ट्राइप सुरक्षित",
      stripeProtectedDesc: "सभी भुगतान स्ट्राइप के माध्यम से प्रोसेस होते हैं, खरीदार और विक्रेता दोनों की सुरक्षा के साथ।",
      autoRelease: "ऑटो-रिलीज़",
      autoReleaseDesc: "अगर निर्धारित समय में कोई जवाब नहीं आता तो भुगतान अपने आप रिलीज हो जाते हैं।",
      
      // How it works
      howItWorksTitle: "FlowPay कैसे काम करता है",
      howItWorksDescription: "सरल, सुरक्षित और पारदर्शी",
      step1Title: "डील बनाएं और स्वीकार करें",
      step1Description: "ब्रांड माइलस्टोन के साथ डील बनाता है। क्रिएटर शर्तों की समीक्षा करके स्वीकार करता है।",
      step2Title: "सुरक्षित फंडिंग",
      step2Description: "ब्रांड एस्क्रो को फंड करता है। काम पूरा होने तक पैसा सुरक्षित रखा जाता है।",
      step3Title: "तुरंत भुगतान",
      step3Description: "क्रिएटर काम डिलीवर करता है। अप्रूवल पर भुगतान तुरंत रिलीज हो जाता है।",
      
      // Reviews
      reviewsTitle: "हमारे यूजर्स क्या कहते हैं",
      reviewsRating: "2,500+ समीक्षाओं से 4.9/5",
      
      // Security
      securityTitle: "बैंक-ग्रेड सिक्यूरिटी",
      securityDescription: "आपका पैसा और डेटा उन्हीं सिक्यूरिटी स्टैंडर्ड से सुरक्षित है जो बड़े वित्तीय संस्थान इस्तेमाल करते हैं",
      stripeSecured: "स्ट्राइप सुरक्षित",
      stripeSecuredDesc: "सभी भुगतान स्ट्राइप के माध्यम से PCI DSS लेवल 1 अनुपालन के साथ प्रोसेस होते हैं",
      verifiedUsers: "वेरिफाइड यूजर्स",
      verifiedUsersDesc: "KYC वेरिफिकेशन यह सुनिश्चित करता है कि सभी यूजर्स वैध और भरोसेमंद हैं",
      successRate: "99.8% सफलता दर",
      successRateDesc: "हजारों सफल लेनदेन के साथ सिद्ध ट्रैक रिकॉर्ड",
      
      // Guarantee
      guaranteeTitle: "100% पैसे वापसी की गारंटी",
      guaranteeDescription: "अगर आप अपने पहले 30 दिनों में FlowPay से पूरी तरह संतुष्ट नहीं हैं, तो हम हर पैसा वापस कर देंगे। कोई सवाल नहीं।",
      dayGuarantee: "30-दिन की गारंटी",
      noQuestionsAsked: "कोई सवाल नहीं",
      fullRefund: "पूरा रिफंड",
      
      // CTA
      ctaTitle: "तुरंत पेमेंट पाने के लिए तैयार हैं?",
      ctaDescription: "हजारों क्रिएटर्स और ब्रांड्स के साथ जुड़ें जो सुरक्षित, तुरंत भुगतान के लिए FlowPay पर भरोसा करते हैं",
      startFreeToday: "आज मुफ्त में शुरू करें",
      noSetupFees: "कोई सेटअप फीस नहीं • कोई मासिक फीस नहीं • सिर्फ तब पे करें जब आपको पेमेंट मिले",
      moneyBackGuarantee: "30-दिन मनी-बैक गारंटी",
      
      // Auth
      welcomeBack: "वापस स्वागत है",
      joinFlowPay: "FlowPay से जुड़ें",
      signInToAccount: "अपने FlowPay अकाउंट में साइन इन करें",
      createAccount: "शुरू करने के लिए अपना FlowPay अकाउंट बनाएं",
      firstName: "पहला नाम",
      lastName: "अंतिम नाम", 
      email: "ईमेल",
      password: "पासवर्ड",
      iAm: "मैं हूं...",
      creator: "क्रिएटर",
      brand: "ब्रांड",
      createAccountButton: "अकाउंट बनाएं",
      signInButton: "साइन इन",
      noAccount: "कोई अकाउंट नहीं? साइन अप करें",
      hasAccount: "पहले से अकाउंट है? साइन इन करें",
      
      // Dashboard
      welcomeBackCreator: "वापस स्वागत है, {{name}}! अमेजिंग कंटेंट बनाने के लिए तैयार हैं?",
      welcomeBackBrand: "वापस स्वागत है, {{name}}! कुछ शानदार पार्टनरशिप बनाते हैं।",
      welcomeBackAdmin: "वापस स्वागत है, {{name}}! यहां आपका एडमिन ओवरव्यू है।",
      totalDeals: "कुल डील्स",
      activeDeals: "सक्रिय डील्स",
      totalValue: "कुल वैल्यू",
      completed: "पूर्ण",
      recentDeals: "हाल की डील्स",
      allTimePartnerships: "सभी समय की पार्टनरशिप",
      currentlyFunded: "वर्तमान में फंडेड",
      acrossAllDeals: "सभी डील्स में",
      successfullyReleased: "सफलतापूर्वक रिलीज़",
      
      // Pricing
      choosePlan: "अपना प्लान चुनें",
      pricingDescription: "मुफ्त में शुरू करें, फिर अपने बिजनेस के साथ स्केल करने वाला प्लान चुनें",
      monthly: "मासिक",
      yearly: "वार्षिक",
      save17: "17% बचत",
      currentPlan: "वर्तमान में {{plan}} प्लान पर",
      mostPopular: "सबसे लोकप्रिय",
      currentPlanBadge: "वर्तमान प्लान",
      
      // Common
      loading: "लोड हो रहा है...",
      cancel: "रद्द करें",
      save: "सेव करें",
      edit: "एडिट करें",
      delete: "डिलीट करें",
      continue: "जारी रखें",
      back: "वापस",
      next: "अगला",
      submit: "सबमिट करें",
      close: "बंद करें",
    }
  },
  nl: {
    translation: {
      // Navigation
      features: "Functies",
      reviews: "Reviews",
      security: "Beveiliging",
      blog: "Blog",
      pricing: "Prijzen",
      signIn: "Inloggen",
      getStarted: "Aan de slag",
      
      // Landing Page Hero
      trustedBy: "🚀 Vertrouwd door 15.000+ creators en merken",
      heroTitle: "Ontvang Directe Betalingen voor je",
      heroTitleHighlight: "Creator Werk",
      heroDescription: "Veilig escrow platform dat zowel creators als merken beschermt. Geld wordt automatisch vrijgegeven wanneer werk is goedgekeurd - geen betalingsvertragingen meer.",
      startCreatingDeals: "Begin met Deals Maken",
      watchDemo: "Bekijk Demo",
      
      // Stats
      paidToCreators: "Uitbetaald aan Creators",
      successfulDeals: "Succesvolle Deals",
      paymentSuccessRate: "Betaling Slagingspercentage",
      averagePayoutTime: "Gemiddelde Uitbetalingstijd",
      
      // Features
      featuresTitle: "Waarom Creators & Merken voor FlowPay Kiezen",
      featuresDescription: "Speciaal gebouwd voor de creator economie met functies die iedereen beschermen",
      secureEscrow: "Veilige Escrow",
      secureEscrowDesc: "Je geld is beschermd met bankwaardige beveiliging totdat leveringen zijn goedgekeurd.",
      instantPayouts: "Directe Uitbetalingen",
      instantPayoutsDesc: "Creators worden direct betaald na goedkeuring - niet meer 30 dagen wachten op betaling.",
      stripeProtected: "Stripe Beschermd",
      stripeProtectedDesc: "Alle betalingen verwerkt via Stripe met koper en verkoper bescherming.",
      autoRelease: "Auto-Vrijgave",
      autoReleaseDesc: "Betalingen worden automatisch vrijgegeven als er geen reactie komt binnen de afgesproken tijd.",
      
      // How it works
      howItWorksTitle: "Hoe FlowPay Werkt",
      howItWorksDescription: "Eenvoudig, veilig en transparant",
      step1Title: "Deal Maken & Accepteren",
      step1Description: "Merk maakt deal met mijlpalen. Creator bekijkt en accepteert voorwaarden.",
      step2Title: "Veilige Financiering",
      step2Description: "Merk financiert de escrow. Geld wordt veilig bewaard tot het werk is voltooid.",
      step3Title: "Directe Betaling",
      step3Description: "Creator levert werk op. Bij goedkeuring wordt betaling direct vrijgegeven.",
      
      // Reviews
      reviewsTitle: "Wat Onze Gebruikers Zeggen",
      reviewsRating: "4.9/5 uit 2.500+ reviews",
      
      // Security
      securityTitle: "Bank-niveau Beveiliging",
      securityDescription: "Je geld en gegevens zijn beschermd met dezelfde beveiligingsstandaarden als grote financiële instellingen",
      stripeSecured: "Stripe Beveiligd",
      stripeSecuredDesc: "Alle betalingen verwerkt via Stripe met PCI DSS Level 1 compliance",
      verifiedUsers: "Geverifieerde Gebruikers",
      verifiedUsersDesc: "KYC verificatie zorgt ervoor dat alle gebruikers legitiem en betrouwbaar zijn",
      successRate: "99.8% Slagingspercentage",
      successRateDesc: "Bewezen track record met duizenden succesvolle transacties",
      
      // Guarantee
      guaranteeTitle: "100% Geld-Terug Garantie",
      guaranteeDescription: "Als je niet volledig tevreden bent met FlowPay binnen je eerste 30 dagen, geven we elke cent terug. Geen vragen gesteld.",
      dayGuarantee: "30-dagen garantie",
      noQuestionsAsked: "Geen vragen gesteld",
      fullRefund: "Volledige terugbetaling",
      
      // CTA
      ctaTitle: "Klaar om Direct Betaald te Worden?",
      ctaDescription: "Sluit je aan bij duizenden creators en merken die FlowPay vertrouwen voor veilige, directe betalingen",
      startFreeToday: "Start Vandaag Gratis",
      noSetupFees: "Geen setup kosten • Geen maandelijkse kosten • Betaal alleen wanneer jij betaald wordt",
      moneyBackGuarantee: "30-dagen geld-terug garantie",
      
      // Auth
      welcomeBack: "Welkom Terug",
      joinFlowPay: "Word lid van FlowPay",
      signInToAccount: "Log in op je FlowPay account",
      createAccount: "Maak je FlowPay account om te beginnen",
      firstName: "Voornaam",
      lastName: "Achternaam",
      email: "E-mail",
      password: "Wachtwoord", 
      iAm: "Ik ben een...",
      creator: "Creator",
      brand: "Merk",
      createAccountButton: "Account Aanmaken",
      signInButton: "Inloggen",
      noAccount: "Geen account? Registreer je",
      hasAccount: "Al een account? Log in",
      
      // Dashboard
      welcomeBackCreator: "Welkom terug, {{name}}! Klaar om geweldige content te maken?",
      welcomeBackBrand: "Welkom terug, {{name}}! Laten we een paar mooie partnerships maken.",
      welcomeBackAdmin: "Welkom terug, {{name}}! Hier is je admin overzicht.",
      totalDeals: "Totaal Deals",
      activeDeals: "Actieve Deals",
      totalValue: "Totale Waarde",
      completed: "Voltooid",
      recentDeals: "Recente Deals",
      allTimePartnerships: "Alle partnerships",
      currentlyFunded: "Momenteel gefinancierd",
      acrossAllDeals: "Over alle deals",
      successfullyReleased: "Succesvol vrijgegeven",
      
      // Pricing
      choosePlan: "Kies Je Plan",
      pricingDescription: "Begin gratis, kies dan een plan dat met je bedrijf meeschaalt",
      monthly: "Maandelijks",
      yearly: "Jaarlijks",
      save17: "Bespaar 17%",
      currentPlan: "Momenteel op {{plan}} plan",
      mostPopular: "Populairst",
      currentPlanBadge: "Huidige Plan",
      
      // Common
      loading: "Laden...",
      cancel: "Annuleren",
      save: "Opslaan",
      edit: "Bewerken", 
      delete: "Verwijderen",
      continue: "Doorgaan",
      back: "Terug",
      next: "Volgende",
      submit: "Versturen",
      close: "Sluiten",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'flowpay-language',
    },
    
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;