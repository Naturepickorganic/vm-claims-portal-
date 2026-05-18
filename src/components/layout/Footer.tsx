import { Link } from 'react-router-dom'
import { Phone, Mail, AlertTriangle, Shield, Accessibility, Globe } from 'lucide-react'
import VMlogo from '@/components/ui/VMlogo'

const FOOTER_LINKS = {
  Claims: [
    { label:'File a Claim',           to:'/file-claim'              },
    { label:'Track a Claim',          to:'/track'                   },
    { label:'Third-Party Claim',      to:'/claims/third-party/new'  },
    { label:'Glass / Windshield',     to:'/claims/glass/new'        },
    { label:'Roadside Assistance',    to:'tel:18008262534'           },
  ],
  Coverage: [
    { label:'Personal Auto',          to:'/file-claim' },
    { label:'Personal Home',          to:'/file-claim' },
    { label:'Commercial Auto',        to:'/file-claim' },
    { label:"Workers' Compensation",  to:'/file-claim' },
    { label:'Commercial Agriculture', to:'/file-claim' },
  ],
  Account: [
    { label:'Log In',           to:'/login'  },
    { label:'Create Account',   to:'/signup' },
    { label:'Forgot Password',  to:'/login'  },
  ],
  Company: [
    { label:'About ValueMomentum',  to:'https://www.valuemomentum.com'          },
    { label:'Careers',              to:'https://www.valuemomentum.com/careers'  },
    { label:'Contact Us',           to:'mailto:claims@valuemomentum.com'        },
    { label:'Report Fraud',         to:'mailto:fraud@valuemomentum.com'         },
  ],
}

const LEGAL_LINKS = [
  'Privacy Policy','Terms of Use','Cookie Policy','Accessibility','Licensing',
]

const CERTS = [
  { icon: <Shield size={12} />, label:'SOC 2 Type II'     },
  { icon: <Globe size={12} />,  label:'ISO 27001'         },
  { icon: <Accessibility size={12} />, label:'WCAG 2.1 AA' },
  { icon: <Shield size={12} />, label:'NAIC Compliant'    },
]

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-navy border-t border-white/10">

      {/* Emergency bar — VM Gold */}
      <div className="px-5 md:px-[60px] py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2"
        style={{ background:'#FABD00' }}>
        <div className="flex items-center gap-2.5 text-navy text-[13px] font-bold">
          <AlertTriangle size={16} />
          24/7 Claims Emergency Line
        </div>
        <a href="tel:18008262534"
          className="font-black text-[16px] text-navy hover:opacity-80 transition-opacity"
          style={{ fontFamily:'DM Sans, sans-serif' }}>
          1-800-VM-CLAIMS
        </a>
      </div>

      {/* Main footer */}
      <div className="px-5 md:px-[60px] py-12">

        {/* Brand + links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <VMlogo size="md" variant="full-light" />
            </div>
            <p className="text-[12px] text-white/40 leading-relaxed mb-4">
              Powering the claims experience for leading P&amp;C carriers across North America.
            </p>
            <div className="flex gap-2">
              <a href="mailto:claims@valuemomentum.com"
                className="w-8 h-8 rounded-lg border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 transition-colors">
                <Mail size={13} />
              </a>
              <a href="tel:18008262534"
                className="w-8 h-8 rounded-lg border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 transition-colors">
                <Phone size={13} />
              </a>
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <div className="text-[10px] font-bold tracking-widest uppercase text-white/30 mb-4">{title}</div>
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

        {/* Certifications */}
        <div className="flex flex-wrap gap-2.5 mb-8 pt-8 border-t border-white/10">
          {CERTS.map(c => (
            <div key={c.label}
              className="flex items-center gap-1.5 text-[11px] text-white/35 border border-white/10 px-3 py-1.5 rounded-full">
              <span className="text-white/30">{c.icon}</span>{c.label}
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-[11px] text-white/35 border border-white/10 px-3 py-1.5 rounded-full">
            <span className="text-[10px]">GW</span>Guidewire Partner
          </div>
        </div>

        {/* Legal disclaimer */}
        <div className="bg-white/4 border border-white/10 rounded-xl p-4 mb-6">
          <p className="text-[11px] text-white/25 leading-relaxed">
            <strong className="text-white/35">Legal Disclaimer:</strong>{' '}
            Coverage availability and claim outcomes are subject to the terms, conditions, and exclusions of your
            individual insurance policy. ValueMomentum is a technology and implementation partner — actual insurance
            coverage is provided by the carrier named on your policy declarations page. Unauthorized access is
            prohibited. Claims information displayed does not constitute a coverage determination or payment guarantee.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="text-[11.5px] text-white/25">
            © {year} ValueMomentum, Inc. All rights reserved.
          </div>
          <div className="flex flex-wrap gap-4">
            {LEGAL_LINKS.map(l => (
              <button key={l} className="text-[11.5px] text-white/25 hover:text-white/50 transition-colors bg-transparent border-none cursor-pointer">
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
