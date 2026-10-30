import { MapPin, Users, Heart, Search, CheckCircle2 } from "lucide-react";
import { TRUST, STEPS } from "@/lib/data";

const ICONS = { pin: MapPin, users: Users, heart: Heart, search: Search, check: CheckCircle2 };

export default function Trust() {
  return (
    <section className="trust">
      <div className="container">
        <div className="trust-head">
          <span className="eyebrow">مبني على الثقة</span>
          <h2>لماذا يثق الناس بنا</h2>
        </div>
        <div className="features">
          {TRUST.map(({ icon, title, text }) => {
            const Icon = ICONS[icon];
            return (
              <div key={title}>
                <span className="ficon"><Icon size={20} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            );
          })}
        </div>
        <div className="steps">
          <div>
            <span className="eyebrow">3 خطوات بسيطة</span>
            <h2>من البحث إلى الصفقة بسهولة</h2>
          </div>
          {STEPS.map(({ icon, title, text }, i) => {
            const Icon = ICONS[icon];
            return (
              <div key={title} className="step">
                <div className="step-top"><span className="num">{i + 1}</span><Icon size={18} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
