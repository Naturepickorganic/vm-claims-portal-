import { Link } from 'react-router-dom'

const FOOTER_LINKS = {
  Claims: [
    { label:'File a Claim',          to:'/file-claim'  },
    { label:'Track a Claim',         to:'/track'       },
    { label:'Third-Party Claim',     to:'/claims/third-party/new' },
    { label:'Glass / Windshield',    to:'/file-claim'  },
    { label:'Roadside Assistance',   to:'tel:18008262534' },
  ],
  Coverage: [
    { label:'Personal Auto',         to:'/file-claim'  },
    { label:'Personal Property',     to:'/file-claim'  },
    { label:'Commercial Property',   to:'/file-claim'  },
    { label:"Workers' Compensation", to:'/file-claim'  },
    { label:'Commercial Agriculture',to:'/file-claim'  },
  ],
  Account: [
    { label:'Log In',                to:'/login'       },
    { label:'Create Account',        to:'/signup'      },
    { label:'Forgot Password',       to:'/login'       },
  ],
  Company: [
    { label:'About ValueMomentum',   to:'https://www.valuemomentum.com' },
    { label:'Careers',               to:'https://www.valuemomentum.com/careers' },
    { label:'Contact Us',            to:'mailto:claims@valuemomentum.com' },
    { label:'Report Fraud',          to:'mailto:fraud@valuemomentum.com' },
  ],
}

const LEGAL_LINKS = [
  { label:'Privacy Policy',     to:'/privacy'       },
  { label:'Terms of Use',       to:'/terms'         },
  { label:'Cookie Policy',      to:'/cookies'       },
  { label:'Accessibility',      to:'/accessibility' },
  { label:'Sitemap',            to:'/sitemap'       },
  { label:'Licensing',          to:'/licensing'     },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-navy border-t border-white/8">

      {/* Emergency bar */}
      <div className="bg-red px-5 md:px-[60px] py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-white text-[13px] font-semibold">
          <span>🚨 24/7 Claims Emergency Line</span>
        </div>
        <a href="tel:18008262534" className="text-white font-display font-black text-[16px] hover:opacity-80 transition-opacity">
          1-800-VM-CLAIMS (1-800-862-2534)
        </a>
      </div>

      {/* Main footer links */}
      <div className="px-5 md:px-[60px] py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-[34px] h-[34px] rounded-lg bg-red flex items-center justify-center font-display font-black text-[15px] text-white">VM</div>
              <div>
                <div className="font-display font-black text-[13px] text-white">ValueMomentum</div>
                <div className="text-[10px] text-white/40">Claims Portal</div>
              </div>
            </div>
            <p className="text-[12px] text-white/40 leading-relaxed mb-4">
              Powering the claims experience for leading P&amp;C insurance carriers across North America.
            </p>
            <div className="flex gap-3">
              {[
                { icon:'in', label:'LinkedIn', href:'https://linkedin.com/company/valuemomentum' },
                { icon:'tw', label:'Twitter',  href:'https://twitter.com/valuemomentum'  },
              ].map(s => (
                <a key={s.icon} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg border border-white/15 flex items-center justify-center text-[10px] font-bold text-white/50 hover:text-white hover:border-white/40 transition-colors">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <div className="text-[10.5px] font-bold tracking-widest uppercase text-white/30 mb-4">{title}</div>
              <ul className="flex flex-col gap-2.5">
                {links.map(l => (
                  <li key={l.label}>
                    {l.to.startsWith('http') || l.to.startsWith('mailto') || l.to.startsWith('tel')
                      ? <a href={l.to} className="text-[12.5px] text-white/50 hover:text-white transition-colors">{l.label}</a>
                      : <Link to={l.to} className="text-[12.5px] text-white/50 hover:text-white transition-colors">{l.label}</Link>
                    }
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Certifications row */}
        <div className="flex flex-wrap gap-3 mb-8 pt-8 border-t border-white/8">
          {[
            '🔒 SOC 2 Type II Certified',
            '🛡️ ISO 27001',
            '♿ WCAG 2.1 AA',
            '✅ NAIC Compliant',
            '🏦 State Licensed',
          ].map(c => (
            <div key={c} className="flex items-center gap-1.5 text-[11px] text-white/35 border border-white/10 px-3 py-1.5 rounded-full">{c}</div>
          ))}
        </div>

        {/* Legal disclaimer */}
        <div className="bg-white/4 border border-white/8 rounded-xl p-4 mb-6">
          <p className="text-[11px] text-white/30 leading-relaxed">
            <strong className="text-white/40">Legal Disclaimer:</strong> Coverage availability and claim outcomes are subject to the terms, conditions, and exclusions of your individual insurance policy.
            ValueMomentum is a technology and implementation partner — actual insurance coverage is provided by the carrier named on your policy declarations page.
            This portal is intended for use by policyholders and authorized claimants only. Unauthorized access is prohibited and may be subject to civil and criminal penalties.
            Claims information displayed is for reference purposes and does not constitute a coverage determination or payment guarantee.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="text-[11.5px] text-white/30">
            © {year} ValueMomentum, Inc. All rights reserved. · A Guidewire Implementation Partner
          </div>
          <div className="flex flex-wrap gap-4">
            {LEGAL_LINKS.map(l => (
              <Link key={l.label} to={l.to} className="text-[11.5px] text-white/30 hover:text-white/60 transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
