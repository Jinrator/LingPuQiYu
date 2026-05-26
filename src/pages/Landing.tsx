import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Monitor,
  Cpu,
  Target,
  Rocket,
  Map,
  Palette,
  Disc,
  Bot,
  Phone,
  Mail,
  Menu,
  X,
} from 'lucide-react';

function useScrollFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function FadeInSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollFadeIn();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  );
}

function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: '关于我们', href: '#about' },
    { label: '产品生态', href: '#ecosystem' },
    { label: '使命愿景', href: '#mission' },
    { label: '联系我们', href: '#contact' },
  ];

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="h-screen w-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src="/logo/logo.png" alt="灵谱奇域" className="h-8 w-8 object-contain" />
              <span className="font-fredoka text-xl font-bold text-gray-900">生音科技</span>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleAnchorClick(e, link.href)}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/app/lab"
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:shadow-lg"
                style={{ backgroundColor: '#5BA4F5' }}
              >
                进入应用 →
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleAnchorClick(e, link.href)}
                  className="block text-gray-600 hover:text-gray-900 py-2"
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/app/lab"
                className="block text-center px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: '#5BA4F5' }}
              >
                进入应用 →
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section
        id="about"
        className="relative min-h-screen flex items-center justify-center pt-16 snap-start snap-always"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        }}
      >
        {/* Subtle accent glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ backgroundColor: '#5BA4F5' }}
        />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <FadeInSection>
            <h1 className="font-fredoka text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              让每个人都能感受到音乐创造带来的快乐
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-10">
              生音科技 · 用AI重新定义音乐教育
            </p>
            <Link
              to="/app/lab"
              className="inline-flex items-center px-8 py-3 rounded-xl text-lg font-medium text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
              style={{ backgroundColor: '#5BA4F5' }}
            >
              立即体验
            </Link>
          </FadeInSection>
        </div>
      </section>

      {/* 三位一体生态系统 */}
      <section id="ecosystem" className="min-h-screen flex flex-col justify-center py-20 lg:py-28 snap-start snap-always" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-16">
              <h2 className="font-fredoka text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                三位一体生态系统
              </h2>
              <p className="text-gray-500 text-lg">
                构建AI音乐「教育+软件+硬件」闭环生态
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: GraduationCap,
                title: '教育 | 生音工坊',
                description: 'AI音乐教育课程体系，系统化培养创作潜能',
                color: '#5BCC8A',
              },
              {
                icon: Monitor,
                title: '软件 | 灵谱奇域',
                description: '趣味AI创作软件，降低门槛轻松变身大师',
                color: '#5BA4F5',
              },
              {
                icon: Cpu,
                title: '硬件 | 灵感精灵',
                description: '多模态传感器捕捉稍纵即逝的创作灵感',
                color: '#F57EB6',
              },
            ].map((card, index) => (
              <FadeInSection key={index}>
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ backgroundColor: `${card.color}15` }}
                  >
                    <card.icon size={28} style={{ color: card.color }} />
                  </div>
                  <h3 className="font-fredoka text-xl font-bold text-gray-900 mb-3">{card.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{card.description}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* 使命 & 愿景 */}
      <section id="mission" className="min-h-screen flex flex-col justify-center py-20 lg:py-28 bg-white snap-start snap-always">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-16">
              <h2 className="font-fredoka text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                使命 & 愿景
              </h2>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <FadeInSection>
              <div
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm"
                style={{ borderLeftWidth: '4px', borderLeftColor: '#5BA4F5' }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#5BA4F515' }}
                  >
                    <Target size={24} style={{ color: '#5BA4F5' }} />
                  </div>
                  <h3 className="font-fredoka text-xl font-bold text-gray-900">使命</h3>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed">
                  用我们的产品，让教师舒心、孩子开心、家长放心。
                </p>
              </div>
            </FadeInSection>

            <FadeInSection>
              <div
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm"
                style={{ borderLeftWidth: '4px', borderLeftColor: '#5BCC8A' }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#5BCC8A15' }}
                  >
                    <Rocket size={24} style={{ color: '#5BCC8A' }} />
                  </div>
                  <h3 className="font-fredoka text-xl font-bold text-gray-900">愿景</h3>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed">
                  成为AI时代音乐教育变革引领者，推动教育数字化普惠。
                </p>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* 产品展示 */}
      <section className="min-h-screen flex flex-col justify-center py-20 lg:py-28 snap-start snap-always" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-16">
              <h2 className="font-fredoka text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                灵谱奇域 — 趣味AI音乐创作平台
              </h2>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: Map,
                title: '冒险关卡',
                description: '系统化音乐学习，闯关式进阶体验',
                color: '#F5A05B',
              },
              {
                icon: Palette,
                title: '自由创作',
                description: '开放式音乐工坊，释放无限创意',
                color: '#5BA4F5',
              },
              {
                icon: Disc,
                title: '演出舞台',
                description: '展示音乐作品，收获成就与掌声',
                color: '#F57EB6',
              },
              {
                icon: Bot,
                title: 'AI 助手',
                description: '智能引导教学，个性化学习路径',
                color: '#5BCC8A',
              },
            ].map((feature, index) => (
              <FadeInSection key={index}>
                <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <feature.icon size={22} style={{ color: feature.color }} />
                  </div>
                  <div>
                    <h3 className="font-fredoka text-lg font-bold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-gray-500">{feature.description}</p>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>

          <FadeInSection className="text-center mt-12">
            <Link
              to="/app/lab"
              className="inline-flex items-center px-8 py-3 rounded-xl text-lg font-medium text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
              style={{ backgroundColor: '#5BA4F5' }}
            >
              开始创作之旅 →
            </Link>
          </FadeInSection>
        </div>
      </section>

      {/* 联系我们 & Footer */}
      <section
        id="contact"
        className="min-h-screen flex flex-col justify-center py-20 lg:py-28 snap-start snap-always"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-16">
              <h2 className="font-fredoka text-3xl sm:text-4xl font-bold text-white mb-4">
                联系我们
              </h2>
              <p className="text-gray-400 text-lg">生音科技</p>
            </div>
          </FadeInSection>

          <FadeInSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#5BA4F520' }}
                >
                  <Phone size={18} style={{ color: '#5BA4F5' }} />
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">电话</p>
                  <p className="text-white text-sm">(853) 6556 5179</p>
                  <p className="text-white text-sm">(86) 181 6556 5179</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#5BCC8A20' }}
                >
                  <Mail size={18} style={{ color: '#5BCC8A' }} />
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">邮箱</p>
                  <p className="text-white text-sm">jinbeimusicai@gmail.com</p>
                  <p className="text-white text-sm">1215578879@qq.com</p>
                </div>
              </div>
            </div>
          </FadeInSection>

          {/* Footer */}
          <div className="mt-20 pt-8 border-t border-gray-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-500 text-sm">© 2025 生音科技. All rights reserved.</p>
              <div className="flex items-center gap-6">
                {[
                  { label: '关于我们', href: '#about' },
                  { label: '产品', href: '#ecosystem' },
                  { label: '联系我们', href: '#contact' },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleAnchorClick(e, link.href)}
                    className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;
