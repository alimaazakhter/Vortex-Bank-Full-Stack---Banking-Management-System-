import React from 'react';
import Link from 'next/link';
import { Landmark, Shield, CreditCard, PiggyBank, ArrowRight, ShieldCheck, Cpu, Zap } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import styles from './page.module.css';

export default function Home() {
  const features = [
    {
      icon: CreditCard,
      title: "Virtual Card Generator",
      desc: "Generate active Visa/Mastercard debit cards on demand. Freeze or terminate them with a single click to secure online purchases."
    },
    {
      icon: ArrowRight,
      title: "Double-Entry Transfers",
      desc: "Send and receive funds in real-time. Full transaction histories are instantly updated for both sender and receiver accounts."
    },
    {
      icon: PiggyBank,
      title: "Goal-Oriented Savings",
      desc: "Organize your capital into target-driven pots. Track completion progress and transfer funds to/from your wallet seamlessly."
    }
  ];

  return (
    <div className={styles.container}>
      {/* Header Navigation */}
      <header className={styles.header}>
        <Link href="/" className={styles.logo} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.logoIcon}>
            <Landmark size={22} className={styles.iconPrimary} />
          </div>
          <span>Vortex</span>
        </Link>
        <div className={styles.navActions}>
          <ThemeToggle />
          <Link href="/login" className={`${styles.navLink} btn btn-secondary`}>
            Sign In
          </Link>
          <Link href="/register" className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className={styles.heroSection}>
        <div className={styles.heroLayout}>
          <div className={`${styles.heroContent} animated-fade-in`}>
            <div className={styles.announcement}>
              <span className={styles.announcementBadge}>NEW</span>
              <span className={styles.announcementText}>Vortex Premium Personal Accounts are Live</span>
            </div>
            <h1 className={styles.headline}>
              The Future of Personal <br />
              <span className={styles.gradientText}>Capital Management</span>
            </h1>
            <p className={styles.description}>
              Experience Vortex, the ultimate SaaS dashboard for secure personal banking. Generate virtual cards, budget with savings goals, and manage your wealth inside a 100% free, secure personal account.
            </p>

            <div className={styles.ctas}>
              <Link href="/register" className="btn btn-primary btn-lg">
                <span>Create Free Account</span>
                <ArrowRight size={18} />
              </Link>
              <Link href="/login" className="btn btn-secondary btn-lg">
                <span>Access Dashboard</span>
              </Link>
            </div>

            <div className={styles.trustBanner}>
              <Shield size={16} className={styles.trustIcon} />
              <span>Institutional-grade Security • Zero monthly account fees</span>
            </div>
          </div>

          {/* Floating 3D Premium Debit Card Mockup */}
          <div className={styles.heroCardContainer}>
            <div className={styles.premiumCard3D}>
              <div className={styles.premiumCardFront}>
                <div className={styles.cardGlow}></div>
                <div className={styles.premiumCardHeader}>
                  <span className={styles.premiumCardType}>Vortex Premium</span>
                  <span className={styles.premiumCardBrand}>VORTEX</span>
                </div>
                <div className={styles.premiumCardChip}>
                  <div className={styles.chipLine}></div>
                  <div className={styles.chipLine}></div>
                  <div className={styles.chipLine}></div>
                </div>
                <div className={styles.premiumCardNumber}>
                  •••• •••• •••• 8888
                </div>
                <div className={styles.premiumCardFooter}>
                  <div>
                    <span className={styles.cardLabel}>Card Holder</span>
                    <span className={styles.cardValue}>PREMIUM MEMBER</span>
                  </div>
                  <div>
                    <span className={styles.cardLabel}>Expiry</span>
                    <span className={styles.cardValue}>12/30</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative background glows */}
            <div className={styles.bgGlowCircle1}></div>
            <div className={styles.bgGlowCircle2}></div>
          </div>
        </div>

        {/* Features Grid */}
        <section className={styles.featuresSection}>
          <div className={styles.featuresHeader}>
            <h2>Engineered for Modern Commerce</h2>
            <p>A comprehensive ecosystem loaded with premium tools to secure your cash flow.</p>
          </div>

          <div className={styles.grid}>
            {features.map((f, idx) => {
              const Icon = f.icon;
              return (
                <div key={idx} className={`${styles.featureCard} glass-card`}>
                  <div className={styles.featureIconWrapper}>
                    <Icon size={24} className={styles.featureIcon} />
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Dashboard Preview Showcase */}
        <section className={styles.showcaseSection}>
          <div className={styles.showcaseHeader}>
            <span className={styles.badgeMini}>INTERFACE PREVIEW</span>
            <h2>A Sleek Dashboard Built For Control</h2>
            <p>Get a complete bird's-eye view of your finances with our intuitive capital command center.</p>
          </div>
          <div className={styles.showcaseContainer}>
            {/* CSS Dashboard Mockup */}
            <div className={`${styles.mockupDashboard} glass-card`}>
              <div className={styles.mockupHeader}>
                <div className={styles.mockupDotGroup}>
                  <span className={styles.mockupDot} style={{ background: '#ef4444' }}></span>
                  <span className={styles.mockupDot} style={{ background: '#f59e0b' }}></span>
                  <span className={styles.mockupDot} style={{ background: '#10b981' }}></span>
                </div>
                <div className={styles.mockupUrl}>vortexbank.io/dashboard</div>
              </div>
              <div className={styles.mockupContent}>
                {/* Mock Sidebar */}
                <div className={styles.mockSidebar}>
                  <div className={styles.mockSidebarItemActive}>Overview</div>
                  <div className={styles.mockSidebarItem}>Cards</div>
                  <div className={styles.mockSidebarItem}>Savings</div>
                  <div className={styles.mockSidebarItem}>Analytics</div>
                </div>
                {/* Mock Main Panel */}
                <div className={styles.mockMain}>
                  <div className={styles.mockGrid}>
                    <div className={styles.mockCard}>
                      <span>Main Wallet</span>
                      <h3>₹84,230.00</h3>
                    </div>
                    <div className={styles.mockCard}>
                      <span>Active Cards</span>
                      <h3>4 Cards</h3>
                    </div>
                    <div className={styles.mockCard}>
                      <span>Savings Pots</span>
                      <h3>3 Goals</h3>
                    </div>
                  </div>
                  {/* Mock Charts or Activity */}
                  <div className={styles.mockChartArea}>
                    <div className={styles.mockChartHeader}>
                      <span>Capital Flow Analytics</span>
                      <span className={styles.mockTagGreen}>+14.2% MoM</span>
                    </div>
                    <div className={styles.mockLines}>
                      <div className={styles.mockLine} style={{ width: '80%' }}></div>
                      <div className={styles.mockLine} style={{ width: '55%' }}></div>
                      <div className={styles.mockLine} style={{ width: '90%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Technology */}
        <section className={styles.securitySection}>
          <div className={styles.securityHeader}>
            <span className={styles.badgeMini}>SECURE INFRASTRUCTURE</span>
            <h2>Simulated Safety, Ultimate Performance</h2>
            <p>We leverage next-generation features to build a sandboxed environment that replicates real banking mechanics.</p>
          </div>
          <div className={styles.securityGrid}>
            <div className={styles.securityCard}>
              <div className={styles.securityIconWrapper}>
                <ShieldCheck size={24} />
              </div>
              <h3>Strict Access Controls</h3>
              <p>Double-layer authentication guards your balance. A 4-digit PIN secures every outgoing transfer and savings adjustment.</p>
            </div>
            <div className={styles.securityCard}>
              <div className={styles.securityIconWrapper}>
                <Cpu size={24} />
              </div>
              <h3>SQLite Database Isolation</h3>
              <p>Your financial ledger is private and isolated. Data is locally persisted using structured SQLite file boundaries.</p>
            </div>
            <div className={styles.securityCard}>
              <div className={styles.securityIconWrapper}>
                <Zap size={24} />
              </div>
              <h3>Instant Card Freezing</h3>
              <p>Suspect a leak? Click freeze on any virtual card to instantly lock operations and block simulated billing queries.</p>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className={styles.faqSection}>
          <div className={styles.faqHeader}>
            <span className={styles.badgeMini}>COMMON QUESTIONS</span>
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about the Vortex simulated banking dashboard.</p>
          </div>
          <div className={styles.faqGrid}>
            <div className={styles.faqCard}>
              <h4>Is Vortex a real bank?</h4>
              <p>No. Vortex is a 100% simulated sandbox dashboard for educational and portfolio demonstration. No real financial operations are executed, and no real currency is used.</p>
            </div>
            <div className={styles.faqCard}>
              <h4>How does the Virtual Card Generator work?</h4>
              <p>Vortex generates simulated Visa/Mastercard credentials that can be frozen, unfrozen, or deleted instantly. These card numbers are purely educational and cannot be used in real stores.</p>
            </div>
            <div className={styles.faqCard}>
              <h4>How are my login credentials secured?</h4>
              <p>We use industry-standard bcrypt hashing for passwords and maintain user session security via encrypted database hashes and session cookies.</p>
            </div>
            <div className={styles.faqCard}>
              <h4>Can I run transfers to other users?</h4>
              <p>Yes! Vortex supports cross-account double-entry transfers inside the local SQLite database. You can search other usernames and send funds in real-time.</p>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className={`${styles.ctaSection} glass-card`}>
          <h2>Ready to take control of your simulated wealth?</h2>
          <p>Create a secure personal workspace in less than 30 seconds and start testing virtual cards today.</p>
          <div className={styles.ctaButtons}>
            <Link href="/register" className="btn btn-primary btn-lg">
              <span>Get Started for Free</span>
              <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="btn btn-secondary btn-lg">
              <span>Access Sandbox</span>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerBrand}>
            <div className={styles.footerBrandLogo}>
              <Landmark size={22} className={styles.iconPrimary} />
              <span>Vortex</span>
            </div>
            <p className={styles.footerBrandDesc}>
              A secure, simulated SaaS personal banking and capital management dashboard. Manage virtual cards, budget stashes, and track expenses.
            </p>
          </div>
          
          <div className={styles.footerCol}>
            <h4>Products</h4>
            <ul>
              <li><Link href="/register">Virtual Cards</Link></li>
              <li><Link href="/register">Savings Pots</Link></li>
              <li><Link href="/register">Instant Transfers</Link></li>
              <li><Link href="/register">AI Expense Analyst</Link></li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h4>Security</h4>
            <ul>
              <li><Link href="#">Institutional Security</Link></li>
              <li><Link href="#">Privacy Shield</Link></li>
              <li><Link href="#">Terms of Service</Link></li>
              <li><Link href="#">System Status</Link></li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h4>Contact & Help</h4>
            <ul>
              <li><Link href="#">Help Center</Link></li>
              <li><Link href="#">Developer APIs</Link></li>
              <li><Link href="#">Support Desk</Link></li>
              <li><Link href="#">Simulated Sandbox</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.footerDisclaimer}>
          <strong>Disclaimer:</strong> Vortex is an educational, simulated banking platform. All account balances, transactions, and virtual credit cards are completely virtual and for demonstration purposes only. No real money operations or financial transactions are executed on this platform.
        </div>

        <div className={styles.footerBottom}>
          <p>© 2026 Vortex Fintech Group. All rights reserved.</p>
          <p>Built with Premium Fintech Design Language</p>
        </div>
      </footer>
    </div>
  );
}
