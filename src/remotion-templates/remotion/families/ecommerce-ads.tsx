import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, GradientMeshBackground, clampInterp, resolvePalette, seededRand, type Palette } from "../lib/primitives";

/**
 * FAMILY: ecommerce-ads
 * Commerce-first short-form systems: product, price, variants, proof,
 * fulfillment, cart and urgency beats. Defaults are procedural so every
 * composition renders without fetching an asset; productImage is optional.
 */
type EcommerceVariant =
  | "product-spin"
  | "price-drop"
  | "variant-swatch"
  | "review-burst"
  | "bundle-offer"
  | "shipping-proof"
  | "cart-add"
  | "size-guide"
  | "limited-stock"
  | "shop-now";

export interface EcommerceAdsProps {
  variant: EcommerceVariant;
  productName: string;
  tagline: string;
  price: string;
  compareAt?: string;
  productImage?: string;
  variants?: string[];
  rating?: number;
  reviewCount?: string;
  shipping?: string;
  cta?: string;
  paletteName: string;
  features?: string[];
  stock?: number;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';

const ProductShape: React.FC<{
  p: EcommerceAdsProps;
  pal: Palette;
  scale?: number;
  angle?: number;
  compact?: boolean;
}> = ({ p, pal, scale = 1, angle = 0, compact = false }) => {
  const frame = useCurrentFrame();
  const shine = ((frame * 2.2) % 130) - 35;
  const image = p.productImage;
  return (
    <div style={{ position: "relative", width: compact ? 210 : 330, height: compact ? 280 : 460, transform: `scale(${scale}) rotateY(${angle}deg)`, transformStyle: "preserve-3d", filter: "drop-shadow(0 36px 32px #0009)" }}>
      <div style={{ position: "absolute", left: "50%", top: compact ? 10 : 18, transform: "translateX(-50%)", width: compact ? 70 : 104, height: compact ? 42 : 65, borderRadius: "12px 12px 5px 5px", background: "linear-gradient(90deg,#252832,#a7afbb,#20232b)", border: "1px solid #ffffff45" }} />
      <div style={{ position: "absolute", left: "50%", top: compact ? 35 : 58, transform: "translateX(-50%)", width: compact ? 160 : 250, height: compact ? 235 : 390, overflow: "hidden", borderRadius: compact ? "48px 48px 32px 32px" : "76px 76px 50px 50px", background: `linear-gradient(108deg,${pal.primary}dc 0%,${pal.secondary}e8 43%,${pal.primary}98 70%,${pal.bg} 100%)`, border: "2px solid #ffffff57", boxShadow: "inset 16px 0 25px #fff3" }}>
        {image ? <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <>
          <div style={{ position: "absolute", left: shine, top: -50, width: 70, height: 520, transform: "rotate(18deg)", background: "linear-gradient(90deg,transparent,#fff8,transparent)", filter: "blur(9px)" }} />
          <div style={{ position: "absolute", left: compact ? 14 : 22, right: compact ? 14 : 22, top: compact ? 78 : 130, height: compact ? 80 : 126, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: `${pal.bg}db`, border: `1px solid ${pal.text}45`, color: pal.text, fontFamily: FONT }}>
            <div style={{ fontSize: compact ? 12 : 18, fontWeight: 900, letterSpacing: ".18em" }}>{p.productName.slice(0, 12).toUpperCase()}</div>
            <div style={{ color: pal.accent, fontSize: compact ? 9 : 13, letterSpacing: ".12em" }}>ESSENTIAL GOODS</div>
          </div>
        </>}
      </div>
    </div>
  );
};

const Copy: React.FC<{ p: EcommerceAdsProps; pal: Palette; eyebrow?: string; align?: "left" | "center"; titleSize?: number | string; titleMaxWidth?: number | string }> = ({ p, pal, eyebrow = "NEW ARRIVAL", align = "left", titleSize = 66, titleMaxWidth = 680 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ color: pal.text, fontFamily: FONT, textAlign: align, opacity: clampInterp(frame, [4, 20], [0, 1]), transform: `translateY(${clampInterp(frame, [4, 25], [28, 0])}px)` }}>
      <div style={{ color: pal.accent, fontSize: 17, fontWeight: 900, letterSpacing: ".24em" }}>{eyebrow}</div>
      <div style={{ marginTop: 13, maxWidth: titleMaxWidth, fontSize: titleSize, lineHeight: .97, fontWeight: 900, letterSpacing: "-.055em", overflowWrap: "anywhere" }}>{p.productName}</div>
      <div style={{ marginTop: 18, color: `${pal.text}b8`, fontSize: 25, lineHeight: 1.25 }}>{p.tagline}</div>
    </div>
  );
};

const Stars: React.FC<{ pal: Palette; rating?: number; count?: string }> = ({ pal, rating = 4.9, count = "1,284 reviews" }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, color: pal.text, font: `600 18px ${FONT}` }}>
    <span style={{ color: pal.accent, letterSpacing: 3 }}>★★★★★</span><span>{rating.toFixed(1)}</span><span style={{ color: `${pal.text}8a` }}>({count})</span>
  </div>
);

const Price: React.FC<{ p: EcommerceAdsProps; pal: Palette; large?: boolean }> = ({ p, pal, large = false }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 13, fontFamily: FONT }}>
    <span style={{ color: pal.text, fontSize: large ? 55 : 32, fontWeight: 950, letterSpacing: "-.05em" }}>{p.price}</span>
    {p.compareAt && <span style={{ color: `${pal.text}78`, fontSize: large ? 24 : 17, textDecoration: "line-through" }}>{p.compareAt}</span>}
  </div>
);

const Button: React.FC<{ pal: Palette; children: React.ReactNode; compact?: boolean }> = ({ pal, children, compact = false }) => (
  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: compact ? "12px 20px" : "16px 28px", borderRadius: 999, background: pal.accent, color: pal.bg, font: `850 ${compact ? 16 : 20}px ${FONT}`, boxShadow: `0 13px 35px ${pal.accent}55` }}>{children}</div>
);

const Shell: React.FC<{ pal: Palette; children: React.ReactNode; grid?: boolean }> = ({ pal, children, grid = false }) => (
  <AbsoluteFill style={{ overflow: "hidden", background: pal.bg, fontFamily: FONT }}>
    <GradientMeshBackground palette={pal} blobs={grid ? 3 : 5} speed={.55} />
    {children}
  </AbsoluteFill>
);

const ProductSpin: React.FC<{ p: EcommerceAdsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const enter = spring({ frame: Math.max(0, frame - 5), fps: 30, config: { damping: 14, stiffness: 85 } });
  const angle = interpolate(enter, [0, 1], [-100, 0]) + frame * 1.05;
  return <Shell pal={pal}><div style={{ position: "absolute", left: 110, top: 190, width: 600 }}><Copy p={p} pal={pal} eyebrow="MEET YOUR NEW FAVORITE" /><div style={{ marginTop: 33 }}><Price p={p} pal={pal} large /></div><div style={{ marginTop: 28 }}><Button pal={pal}>{p.cta ?? "Shop now"} <span style={{ marginLeft: 13 }}>↗</span></Button></div></div><div style={{ position: "absolute", left: 1120, top: 220, width: 430, height: 530, perspective: 1100, display: "flex", justifyContent: "center" }}><div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${pal.secondary}65`, transform: "rotateX(68deg)" }} /><ProductShape p={p} pal={pal} scale={1.08} angle={angle} /></div><div style={{ position: "absolute", left: 110, bottom: 75, color: `${pal.text}85`, font: `600 16px ${MONO}`, letterSpacing: ".15em" }}>01 / PRODUCT SPIN / {p.productName.toUpperCase()}</div></Shell>;
};

const PriceDrop: React.FC<{ p: EcommerceAdsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const drop = clampInterp(frame, [22, 52], [0, 1]);
  return <Shell pal={pal}><div style={{ position: "absolute", left: 150, top: 135 }}><div style={{ width: 220, height: 220, borderRadius: "50%", background: pal.accent, color: pal.bg, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", transform: `rotate(${interpolate(drop, [0, 1], [-22, 8])}deg) scale(${interpolate(drop, [0, 1], [.5, 1])})`, boxShadow: `0 22px 50px ${pal.accent}55` }}><span style={{ font: `900 19px ${FONT}`, letterSpacing: ".15em" }}>PRICE DROP</span><span style={{ marginTop: 8, font: `950 55px ${FONT}` }}>-{Math.max(10, Math.round((1 - (parseFloat(p.price.replace(/[^0-9.]/g, "")) / Math.max(1, parseFloat((p.compareAt ?? p.price).replace(/[^0-9.]/g, "")))) * 100)))}%</span></div></div><div style={{ position: "absolute", left: 520, top: 184, width: 570 }}><Copy p={p} pal={pal} eyebrow="TODAY ONLY" /><div style={{ marginTop: 30 }}><Price p={p} pal={pal} large /></div><div style={{ marginTop: 25, color: pal.secondary, font: `600 19px ${FONT}` }}>{p.shipping ?? "Free shipping on every order"}</div><div style={{ marginTop: 34 }}><Button pal={pal}>{p.cta ?? "Claim the deal"}</Button></div></div><div style={{ position: "absolute", right: 180, top: 175, transform: `translateY(${clampInterp(frame, [0, 30], [100, 0])}px) rotate(-8deg)` }}><ProductShape p={p} pal={pal} scale={.9} /></div></Shell>;
};

const VariantSwatch: React.FC<{ p: EcommerceAdsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const colors = [pal.primary, pal.secondary, pal.accent, "#f1e4d2", "#20232a"];
  const active = Math.min(colors.length - 1, Math.floor(frame / 24));
  const labels = p.variants ?? ["Dawn", "Ocean", "Berry", "Sand", "Night"];
  return <Shell pal={pal}><div style={{ position: "absolute", left: 135, top: 130, width: 660 }}><Copy p={p} pal={pal} eyebrow="FIND YOUR COLOR" /><div style={{ marginTop: 35, color: pal.text, font: `600 20px ${FONT}` }}>Choose a finish</div><div style={{ display: "flex", gap: 15, marginTop: 17 }}>{labels.slice(0, 5).map((label, i) => <div key={label} style={{ textAlign: "center", color: pal.text, opacity: i === active ? 1 : .55, transform: `scale(${i === active ? 1.12 : 1})`, transition: "none" }}><div style={{ width: 58, height: 58, borderRadius: "50%", background: colors[i], border: `4px solid ${i === active ? pal.text : "transparent"}`, boxShadow: i === active ? `0 0 0 3px ${pal.accent}` : "none" }} /><div style={{ marginTop: 9, fontSize: 14 }}>{label}</div></div>)}</div><div style={{ marginTop: 32 }}><Price p={p} pal={pal} /><span style={{ marginLeft: 18, color: pal.secondary, fontSize: 17 }}>Ships in 24h</span></div></div><div style={{ position: "absolute", right: 215, top: 175, transform: `rotate(${interpolate(active, [0, 4], [-9, 9])}deg)` }}><ProductShape p={{ ...p, paletteName: p.paletteName }} pal={{ ...pal, primary: colors[active], secondary: colors[(active + 1) % colors.length] }} scale={1.03} /></div></Shell>;
};

const ReviewBurst: React.FC<{ p: EcommerceAdsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const review = p.reviewCount ?? "1,284 reviews";
  const quote = "The one thing I reach for every single day.";
  return <Shell pal={pal}><div style={{ position: "absolute", left: "7%", top: "13%", width: "48%", zIndex: 3 }}><div style={{ color: pal.accent, fontSize: "clamp(13px, 1vw, 19px)", fontWeight: 900, letterSpacing: ".16em", whiteSpace: "nowrap" }}>LOVED BY {review.toUpperCase()}</div><div style={{ marginTop: "2.2%", maxWidth: "100%", color: pal.text, font: `850 clamp(30px, 2.5vw, 48px)/1.08 ${FONT}`, letterSpacing: "-.05em", overflowWrap: "anywhere" }}>“{quote}”</div><div style={{ marginTop: "2.4%" }}><Stars pal={pal} rating={p.rating} count={review} /></div><div style={{ marginTop: "2.2%", color: `${pal.text}99`, font: `clamp(12px, .9vw, 17px) ${FONT}`, maxWidth: "100%", overflowWrap: "anywhere" }}>— verified customer, {p.productName}</div><div style={{ marginTop: "2.5%" }}><Button pal={pal}>{p.cta ?? "Try it yourself"}</Button></div></div><div style={{ position: "absolute", right: "7%", top: "16%", width: "26%", height: "55%", display: "flex", justifyContent: "center", zIndex: 2 }}><ProductShape p={p} pal={pal} scale={.58} angle={-9} /></div>{[0, 1, 2, 3].map((i) => <div key={i} style={{ position: "absolute", left: `${70 + seededRand(i + 3) * 14}%`, top: `${12 + seededRand(i + 8) * 70}%`, zIndex: 4, padding: "10px 14px", borderRadius: 18, background: `${pal.bg}e8`, border: `1px solid ${pal.text}25`, color: pal.text, font: `700 clamp(11px, .8vw, 15px) ${FONT}`, opacity: clampInterp(frame, [20 + i * 9, 34 + i * 9], [0, .9]), transform: `rotate(${i % 2 ? 5 : -5}deg)` }}>{["Verified buyer", "★★★★★", "Worth every penny", "Fast delivery"][i]}</div>)}</Shell>;
};

const BundleOffer: React.FC<{ p: EcommerceAdsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  return <Shell pal={pal}><div style={{ position: "absolute", left: 130, top: 155, width: 540 }}><Copy p={p} pal={pal} eyebrow="THE MORE YOU LOVE" /><div style={{ marginTop: 30, display: "flex", alignItems: "baseline", gap: 14 }}><Price p={p} pal={pal} large /><span style={{ color: pal.accent, font: `800 20px ${FONT}` }}>BUNDLE & SAVE</span></div><div style={{ marginTop: 29 }}><Button pal={pal}>{p.cta ?? "Get the bundle"}</Button></div></div><div style={{ position: "absolute", right: 180, top: 170, width: 640, height: 620 }}>{[0, 1, 2].map((i) => <div key={i} style={{ position: "absolute", left: i * 150 + 35, top: i === 1 ? 20 : i === 0 ? 120 : 95, transform: `rotate(${[-13, 0, 12][i]}deg) translateY(${clampInterp(frame, [0, 25 + i * 8], [150, 0])}px)`, zIndex: i }}><ProductShape p={{ ...p, productName: i === 0 ? "DUO" : i === 1 ? p.productName : "MINI" }} pal={{ ...pal, primary: [pal.primary, pal.secondary, pal.accent][i] }} scale={.55} compact /></div>)}</div><div style={{ position: "absolute", right: 145, bottom: 85, color: pal.secondary, font: `600 18px ${FONT}` }}>One for you. One to share. One to keep.</div></Shell>;
};

const ShippingProof: React.FC<{ p: EcommerceAdsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const progress = clampInterp(frame, [15, 100], [0, 1]);
  const stops = ["ORDERED", "PACKED", "ON THE WAY", "AT YOUR DOOR"];
  return <Shell pal={pal} grid><div style={{ position: "absolute", left: 130, top: 130, width: 600 }}><Copy p={p} pal={pal} eyebrow="NO WAITING AROUND" /><div style={{ marginTop: 29, color: pal.secondary, font: `600 20px ${FONT}` }}>{p.shipping ?? "Free, carbon-neutral delivery"}</div><div style={{ marginTop: 34 }}><Button pal={pal}>{p.cta ?? "Shop with confidence"}</Button></div></div><div style={{ position: "absolute", left: 860, right: 130, top: 320 }}><div style={{ position: "relative", height: 5, background: `${pal.text}2c`, borderRadius: 9 }}><div style={{ width: `${progress * 100}%`, height: "100%", background: pal.accent, borderRadius: 9 }} /><div style={{ position: "absolute", left: `${progress * 100}%`, top: "50%", width: 26, height: 26, borderRadius: "50%", background: pal.accent, transform: "translate(-50%,-50%)", boxShadow: `0 0 0 8px ${pal.accent}22` }} /></div><div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>{stops.map((stop, i) => <div key={stop} style={{ width: 140, textAlign: i === 0 ? "left" : i === 3 ? "right" : "center", color: progress >= i / 3 ? pal.text : `${pal.text}55`, font: `750 15px ${FONT}` }}><div style={{ width: 12, height: 12, borderRadius: 20, margin: "0 auto 13px", background: progress >= i / 3 ? pal.accent : `${pal.text}44` }} />{stop}</div>)}</div><div style={{ marginTop: 70, display: "flex", alignItems: "center", gap: 28, color: pal.text }}><ProductShape p={p} pal={pal} compact scale={.55} /><div><div style={{ font: `800 24px ${FONT}` }}>{p.productName}</div><div style={{ color: pal.secondary, marginTop: 8 }}>{p.shipping ?? "Arrives in 2–4 days"}</div></div></div></div></Shell>;
};

const CartAdd: React.FC<{ p: EcommerceAdsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const fly = clampInterp(frame, [24, 72], [0, 1]);
  return <Shell pal={pal}><div style={{ position: "absolute", left: 140, top: 190, width: 600 }}><Copy p={p} pal={pal} eyebrow="READY WHEN YOU ARE" /><div style={{ marginTop: 28 }}><Price p={p} pal={pal} large /></div><div style={{ marginTop: 26 }}><Button pal={pal}>{p.cta ?? "Add to cart"} <span style={{ marginLeft: 12 }}>＋</span></Button></div></div><div style={{ position: "absolute", left: 990, top: 190, width: 650, height: 570 }}><div style={{ position: "absolute", left: 0, top: 70, transform: `translate(${fly * 430}px,${fly * 200}px) scale(${interpolate(fly, [0, 1], [1, .3])}) rotate(${fly * 22}deg)` }}><ProductShape p={p} pal={pal} scale={.75} /></div><div style={{ position: "absolute", right: 0, bottom: 50, width: 250, height: 180, border: `3px solid ${pal.accent}`, borderTop: "none", transform: "perspective(500px) rotateX(-12deg)", color: pal.text, display: "flex", alignItems: "center", justifyContent: "center", font: `800 25px ${FONT}`, opacity: clampInterp(frame, [40, 66], [0, 1]) }}>YOUR CART <span style={{ marginLeft: 10, color: pal.accent }}>✓</span></div><div style={{ position: "absolute", left: 250, top: 210, color: pal.accent, font: `900 70px ${FONT}`, opacity: clampInterp(frame, [25, 42], [0, 1]) }}>→</div></div></Shell>;
};

const SizeGuide: React.FC<{ p: EcommerceAdsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const rows = ["XS", "S", "M", "L", "XL"];
  return <Shell pal={pal}><div style={{ position: "absolute", left: "7%", top: "12%", width: "39%", zIndex: 2 }}><Copy p={p} pal={pal} eyebrow="MADE TO FIT" titleSize="clamp(32px, 2.9vw, 56px)" titleMaxWidth="100%" /><div style={{ marginTop: "4%", maxWidth: "92%", color: pal.secondary, font: `600 clamp(13px, .95vw, 18px)/1.25 ${FONT}` }}>Find your perfect size</div><div style={{ marginTop: "5%" }}><Button pal={pal} compact>View full guide ↗</Button></div></div><div style={{ position: "absolute", right: "5%", top: "10%", width: "50%", padding: "2.2% 1.6% 1.5%", boxSizing: "border-box", borderRadius: 25, background: `${pal.text}0c`, border: `1px solid ${pal.text}25`, color: pal.text, zIndex: 1 }}><div style={{ display: "grid", gridTemplateColumns: "23% repeat(3, minmax(0, 1fr))", gap: 0, font: `600 clamp(10px, .78vw, 15px) ${FONT}`, overflow: "hidden" }}><div style={{ color: pal.accent, paddingBottom: "2%" }}>SIZE</div><div style={{ paddingBottom: "2%" }}>CHEST</div><div style={{ paddingBottom: "2%" }}>WAIST</div><div style={{ paddingBottom: "2%" }}>FIT</div>{rows.map((row, i) => <React.Fragment key={row}><div style={{ padding: "3.2% 4% 3.2% 0", color: i === 2 ? pal.accent : pal.text, fontWeight: 900 }}>{row}</div><div style={{ padding: "3.2% 4%", borderTop: `1px solid ${pal.text}18`, whiteSpace: "nowrap" }}>{[84, 90, 96, 102, 108][i]} cm</div><div style={{ padding: "3.2% 4%", borderTop: `1px solid ${pal.text}18`, whiteSpace: "nowrap" }}>{[68, 74, 80, 86, 92][i]} cm</div><div style={{ padding: "3.2% 4%", borderTop: `1px solid ${pal.text}18`, color: i === 2 ? pal.accent : pal.secondary, whiteSpace: "nowrap" }}>{i === 2 ? "YOUR FIT" : "—"}</div></React.Fragment>)}</div><div style={{ marginTop: "3%", color: `${pal.text}75`, font: `clamp(10px, .73vw, 14px) ${FONT}`, opacity: clampInterp(frame, [20, 40], [0, 1]), whiteSpace: "nowrap" }}>Between sizes? We recommend sizing up.</div></div></Shell>;
};

const LimitedStock: React.FC<{ p: EcommerceAdsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const stock = p.stock ?? 17;
  const pulse = 1 + Math.sin(frame * .18) * .025;
  return <Shell pal={pal}><div style={{ position: "absolute", left: "7%", top: "12%", width: "48%", zIndex: 3 }}><div style={{ color: pal.accent, font: `900 clamp(13px, 1vw, 19px) ${FONT}`, letterSpacing: ".15em", whiteSpace: "nowrap" }}>LIMITED RUN</div><div style={{ marginTop: "2.5%", maxWidth: "100%", color: pal.text, font: `900 clamp(34px, 3vw, 58px)/.98 ${FONT}`, letterSpacing: "-.055em" }}>Almost gone.<br />Make it yours.</div><div style={{ marginTop: "3%" }}><Price p={p} pal={pal} large /></div><div style={{ marginTop: "3%", display: "flex", alignItems: "center", gap: 10, color: pal.accent, font: `800 clamp(12px, .95vw, 18px) ${FONT}` }}><span style={{ width: 11, height: 11, flex: "0 0 auto", borderRadius: 50, background: pal.accent, boxShadow: `0 0 0 7px ${pal.accent}26`, transform: `scale(${pulse})` }} /> Only {stock} left in stock</div><div style={{ marginTop: "3%" }}><Button pal={pal}>{p.cta ?? "Get it before it's gone"}</Button></div></div><div style={{ position: "absolute", right: "6%", top: "13%", width: "28%", height: "54%", display: "flex", justifyContent: "center", zIndex: 2, transform: `rotate(7deg) scale(${interpolate(clampInterp(frame, [0, 25], [0, 1]), [0, 1], [.72, 1])})` }}><ProductShape p={p} pal={pal} scale={.55} /></div><div style={{ position: "absolute", left: "7%", right: "7%", bottom: "7%", height: 7, borderRadius: 9, background: `${pal.text}20` }}><div style={{ width: `${Math.min(100, stock * 2.7)}%`, height: "100%", borderRadius: 9, background: pal.accent }} /></div></Shell>;
};

const ShopNow: React.FC<{ p: EcommerceAdsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const drift = interpolate(frame, [0, durationInFrames], [-18, 18]);
  return <Shell pal={pal}><div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 72% 45%,${pal.primary}8f,transparent 33%),linear-gradient(115deg,${pal.bg},${pal.secondary}25)` }} /><div style={{ position: "absolute", left: 150, top: 180, width: 750 }}><Copy p={p} pal={pal} eyebrow="THE EVERYDAY ESSENTIAL" align="left" /><div style={{ marginTop: 30 }}><Price p={p} pal={pal} large /></div><div style={{ marginTop: 28, display: "flex", gap: 16 }}><Button pal={pal}>{p.cta ?? "Shop now"} <span style={{ marginLeft: 12 }}>↗</span></Button><div style={{ display: "flex", alignItems: "center", color: pal.secondary, font: `600 17px ${FONT}` }}>{p.shipping ?? "Free shipping"}</div></div></div><div style={{ position: "absolute", right: 180, top: 90, transform: `translate(${drift}px,${-drift * .35}px) rotate(-8deg) scale(1.23)`, filter: "drop-shadow(0 70px 55px #000a)" }}><ProductShape p={p} pal={pal} /></div><div style={{ position: "absolute", left: 150, bottom: 65, right: 150, display: "flex", justifyContent: "space-between", color: `${pal.text}77`, font: `14px ${MONO}`, letterSpacing: ".17em" }}><span>SHOP / {p.productName.toUpperCase()}</span><span>01—10 / ESSENTIALS</span></div></Shell>;
};

const VARIANTS: Record<EcommerceVariant, React.FC<{ p: EcommerceAdsProps; pal: Palette }>> = {
  "product-spin": ProductSpin,
  "price-drop": PriceDrop,
  "variant-swatch": VariantSwatch,
  "review-burst": ReviewBurst,
  "bundle-offer": BundleOffer,
  "shipping-proof": ShippingProof,
  "cart-add": CartAdd,
  "size-guide": SizeGuide,
  "limited-stock": LimitedStock,
  "shop-now": ShopNow,
};

export const EcommerceAdsTemplate: React.FC<EcommerceAdsProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? ProductSpin;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ backgroundColor: pal.bg }}><FadeEdges inFrames={12} outFrames={14}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div></FadeEdges></AbsoluteFill>;
};

const familyCast = (component: React.FC<EcommerceAdsProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "ecommerce-ads-product-spin": familyCast(EcommerceAdsTemplate),
  "ecommerce-ads-price-drop": familyCast(EcommerceAdsTemplate),
  "ecommerce-ads-variant-swatch": familyCast(EcommerceAdsTemplate),
  "ecommerce-ads-review-burst": familyCast(EcommerceAdsTemplate),
  "ecommerce-ads-bundle-offer": familyCast(EcommerceAdsTemplate),
  "ecommerce-ads-shipping-proof": familyCast(EcommerceAdsTemplate),
  "ecommerce-ads-cart-add": familyCast(EcommerceAdsTemplate),
  "ecommerce-ads-size-guide": familyCast(EcommerceAdsTemplate),
  "ecommerce-ads-limited-stock": familyCast(EcommerceAdsTemplate),
  "ecommerce-ads-shop-now": familyCast(EcommerceAdsTemplate),
};
