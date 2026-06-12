import { FaCopyright } from "react-icons/fa";
import { FiMail } from "react-icons/fi";

function Footer() {
  return (
    <footer className="site-footer bg-black text-white text-center p-4 mt-5">
      <p className="small text-white-50 mb-0">
        Daily headlines, developing stories, and trusted updates
      </p>
      <p className="mb-1 d-inline-flex align-items-center justify-content-center gap-2">
        <FaCopyright aria-hidden="true" />
        <span>Copyright NATG TV All Rights Reserved</span>
      </p>
    
      <p className="small text-white-50 mb-0 mt-2">
        Developed by Okwi Int&apos;l Tech. Contact us{" "}
        <a
          href="mailto:okwivexxx@gmail.com"
          className="d-inline-flex align-items-center gap-1 text-reset"
        >
          <FiMail aria-hidden="true" />
          <span>okwivexxx@gmail.com</span>
        </a>
      </p>
    </footer>
  );
}

export default Footer;
