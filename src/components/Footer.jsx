import {
  FaCopyright,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaWhatsapp,
} from "react-icons/fa";
import { FiMail } from "react-icons/fi";

const contactLinks = [
  {
    label: "Email Okwi Int'l Tech",
    href: "mailto:okwivexxx@gmail.com",
    Icon: FiMail,
  },
  {
    label: "Contact Okwi Int'l Tech on LinkedIn",
    href: "https://www.linkedin.com/in/okwudiri-obasi-371290419",
    Icon: FaLinkedinIn,
  },
  {
    label: "Contact Okwi Int'l Tech on WhatsApp",
    href: "https://wa.me/2349034014734",
    Icon: FaWhatsapp,
  },
  {
    label: "Follow Okwi Int'l Tech on Facebook",
    href: "https://www.facebook.com/okwivex",
    Icon: FaFacebookF,
  },
  {
    label: "Follow Okwi Int'l Tech on Instagram",
    href: "https://www.instagram.com/obasii.001",
    Icon: FaInstagram,
  },
];

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer mt-5">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="site-footer__name">NATG TV</span>
          <p className="site-footer__tagline">
            Daily headlines, developing stories, and trusted updates.
          </p>
        </div>

        <div className="site-footer__meta">
          <p className="site-footer__copyright">
            <FaCopyright aria-hidden="true" />
            <span>{currentYear} NATG TV. All Rights Reserved.</span>
          </p>

          <p className="site-footer__credit">Developed by Okwi Int&apos;l Tech</p>
        </div>

        <div className="site-footer__contacts" aria-label="Contact links">
          {contactLinks.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              className="site-footer__contact"
              aria-label={label}
              title={label}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noreferrer" : undefined}
            >
              <Icon aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
