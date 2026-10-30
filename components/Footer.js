import Link from "next/link";
import { FOOTER_COLUMNS } from "@/lib/data";
import { APP_NAME } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container foot-top">
        <div className="foot-brand">
          <span className="logo">{APP_NAME}</span>
          <p>منصة بيع وإيجار العقارات في حوش عيسى والمناطق المحيطة، تربطك بالمالك مباشرة بدون وسطاء.</p>
        </div>
        <div className="foot-cols">
          {FOOTER_COLUMNS.map(({ title, links }) => (
            <div key={title}>
              <h4>{title}</h4>
              <ul>{links.map((l) => <li key={l}><Link href="#">{l}</Link></li>)}</ul>
            </div>
          ))}
        </div>
      </div>
      <div className="foot-bottom">© 2026 {APP_NAME}. جميع الحقوق محفوظة.</div>
    </footer>
  );
}
