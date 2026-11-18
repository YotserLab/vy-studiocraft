import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, resolvePalette, seededRand, type Palette } from "../lib/primitives";

type FoodVariant =
  | "ingredient-pour"
  | "recipe-steps"
  | "menu-reveal"
  | "chef-intro"
  | "texture-close"
  | "plating-build"
  | "restaurant-card"
  | "nutrition-card"
  | "dish-carousel"
  | "food-finale";

export interface FoodFilmsProps {
  variant: FoodVariant;
  dishName: string;
  subtitle: string;
  ingredients: string[];
  steps: string[];
  chef: string;
  menu: string[];
  price: string;
  restaurant: string;
  location: string;
  category: string;
  caption: string;
  paletteName: string;
  accentColor?: string;
  imageUrl?: string;
  ingredientImages?: string[];
  dishImages?: string[];
  nutrition?: { label: string; value: string; amount: number }[];
}

const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = '"SFMono-Regular", Consolas, monospace';
const fallbackIngredients = ["Heirloom tomato", "Lemon zest", "Olive oil", "Sea salt"];
const fallbackSteps = ["Prep the ingredients", "Build the base", "Finish with heat", "Plate and serve"];
const fallbackMenu = ["Seasonal starter", "House-made pasta", "Citrus tart"];
const fallbackNutrition = [
  { label: "Energy", value: "420 kcal", amount: 0.72 },
  { label: "Protein", value: "18 g", amount: 0.42 },
  { label: "Carbs", value: "36 g", amount: 0.58 },
];

const cssColor = (color: string, alpha: string) => `${color}${alpha}`;

const Grain: React.FC<{ pal: Palette }> = ({ pal }) => (
  <div
    style={{
      position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.1,
      backgroundImage: `repeating-linear-gradient(0deg, ${pal.text}12 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, ${pal.text}09 0 1px, transparent 1px 5px)`,
      mixBlendMode: "overlay",
    }}
  />
);

const FoodField: React.FC<{ p: FoodFilmsProps; pal: Palette; dark?: boolean }> = ({ p, pal, dark = false }) => {
  const field = p.imageUrl ? (
    <Img src={p.imageUrl} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: dark ? "saturate(0.8) contrast(1.12)" : "saturate(1.08)" }} />
  ) : (
    <>
      <div style={{ position: "absolute", inset: "-10%", background: `radial-gradient(ellipse at 30% 28%, ${pal.accent}aa 0%, transparent 28%), radial-gradient(ellipse at 76% 66%, ${pal.secondary}77 0%, transparent 34%), linear-gradient(135deg, ${pal.primary} 0%, ${pal.bg} 58%, ${pal.secondary}66 100%)`, transform: "scale(1.08)" }} />
      <div style={{ position: "absolute", left: "8%", top: "16%", width: "34%", height: "44%", borderRadius: "50%", background: `radial-gradient(ellipse, ${pal.text}20, transparent 67%)`, transform: "rotate(-18deg)" }} />
      <div style={{ position: "absolute", right: "10%", bottom: "14%", width: "37%", height: "30%", borderRadius: "50%", border: `2px solid ${pal.text}38`, boxShadow: `0 0 0 14px ${pal.text}0b, 0 0 0 28px ${pal.text}08`, transform: "rotate(12deg)" }} />
    </>
  );
  return <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: pal.bg }}>{field}<div style={{ position: "absolute", inset: 0, background: dark ? `linear-gradient(180deg, ${pal.bg}22 25%, ${pal.bg}dd 100%)` : `linear-gradient(180deg, ${pal.bg}08, ${pal.bg}66 100%)` }} /></div>;
};

const Plate: React.FC<{ pal: Palette; accent: string; scale?: number; garnish?: number }> = ({ pal, accent, scale = 1, garnish = 7 }) => (
  <div style={{ position: "relative", width: 380 * scale, height: 300 * scale, borderRadius: "50%", background: `radial-gradient(ellipse at 44% 36%, ${pal.text}dd 0 19%, ${pal.secondary}99 20% 23%, ${pal.text}dd 24% 50%, ${pal.primary}66 51% 57%, ${pal.bg} 58%)`, boxShadow: `0 34px 30px ${pal.bg}88`, transform: "rotate(-7deg)" }}>
    <div style={{ position: "absolute", left: "23%", top: "23%", width: "53%", height: "48%", borderRadius: "50%", background: `radial-gradient(circle at 34% 32%, ${accent}, ${pal.primary} 40%, ${pal.bg} 100%)`, boxShadow: `inset 10px 10px 22px ${pal.text}33` }} />
    {Array.from({ length: garnish }, (_, i) => {
      const angle = (i / garnish) * Math.PI * 2;
      return <span key={`g-${i}`} style={{ position: "absolute", left: `${48 + Math.cos(angle) * 18}%`, top: `${46 + Math.sin(angle) * 14}%`, width: 14 * scale, height: 7 * scale, borderRadius: "100% 0", background: i % 2 ? pal.accent : pal.secondary, transform: `rotate(${i * 47}deg)` }} />;
    })}
  </div>
);

const Label: React.FC<{ children: React.ReactNode; pal: Palette; accent: string }> = ({ children, pal, accent }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, color: pal.text, font: `700 13px ${MONO}`, letterSpacing: "0.17em" }}><span style={{ width: 30, height: 2, background: accent }} />{children}</div>
);

const Frame: React.FC<{ p: FoodFilmsProps; pal: Palette; children: React.ReactNode; dark?: boolean }> = ({ p, pal, children, dark = false }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = Math.min(
    interpolate(frame, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(frame, [Math.max(0, durationInFrames - 18), durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );
  return <AbsoluteFill style={{ background: pal.bg, color: pal.text, fontFamily: SANS, opacity, overflow: "hidden" }}>{children}<Grain pal={pal} />{dark && <div style={{ position: "absolute", inset: 0, pointerEvents: "none", border: `1px solid ${pal.text}22` }} />}</AbsoluteFill>;
};

const FoodRenderer: React.FC<{ p: FoodFilmsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const accent = p.accentColor ?? pal.accent;
  const ingredients = p.ingredients?.length ? p.ingredients : fallbackIngredients;
  const steps = p.steps?.length ? p.steps : fallbackSteps;
  const menu = p.menu?.length ? p.menu : fallbackMenu;
  const nutrition = p.nutrition?.length ? p.nutrition : fallbackNutrition;
  const dishName = p.dishName || "The seasonal plate";
  const image = p.dishImages?.[0] ?? p.imageUrl;
  const progress = interpolate(frame, [12, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  switch (p.variant) {
    case "ingredient-pour":
      return <Frame p={p} pal={pal}><div style={{ position: "absolute", inset: 0, background: `linear-gradient(120deg, ${pal.primary}22, transparent 50%)` }} /><div style={{ position: "absolute", left: "7vw", top: "9vh" }}><Label pal={pal} accent={accent}>INGREDIENTS / {p.category || "TODAY'S PREP"}</Label><h1 style={{ margin: "28px 0 0", font: `700 clamp(48px, 8vw, 124px) ${SERIF}`, lineHeight: 0.9, maxWidth: "64vw" }}>{dishName}</h1></div><div style={{ position: "absolute", left: "8vw", bottom: "10vh", display: "flex", flexDirection: "column", gap: 13 }}>{ingredients.slice(0, 6).map((item, i) => <div key={`${item}-${i}`} style={{ display: "flex", alignItems: "center", gap: 18, font: `600 22px ${SANS}`, opacity: Math.min(1, progress * 1.5 - i * 0.08 + 0.2), transform: `translateX(${Math.max(0, (1 - progress) * 30 + i * 3)}px)` }}><span style={{ width: 12, height: 12, borderRadius: "50%", background: i % 2 ? accent : pal.secondary, boxShadow: `0 0 0 6px ${accent}22` }} />{item}</div>)}</div><div style={{ position: "absolute", right: "8vw", bottom: "12vh" }}><Plate pal={pal} accent={accent} scale={0.82} /></div></Frame>;
    case "recipe-steps":
      return <Frame p={p} pal={pal}><FoodField p={p} pal={pal} /><div style={{ position: "absolute", left: "7vw", right: "7vw", top: "8vh" }}><Label pal={pal} accent={accent}>RECIPE / {p.category || "METHOD"}</Label><div style={{ marginTop: 24, font: `700 clamp(42px, 6vw, 92px) ${SERIF}` }}>{dishName}</div></div><div style={{ position: "absolute", left: "7vw", right: "7vw", bottom: "9vh", display: "flex", gap: 12 }}>{steps.slice(0, 5).map((step, i) => { const active = Math.min(1, Math.max(0, progress * steps.length - i)); return <div key={`${step}-${i}`} style={{ flex: 1, padding: "18px 16px", minHeight: 112, background: `${pal.bg}dd`, borderTop: `3px solid ${i === Math.floor(progress * steps.length) ? accent : pal.secondary}88`, opacity: 0.55 + active * 0.45 }}><div style={{ color: accent, font: `700 12px ${MONO}`, letterSpacing: "0.14em" }}>STEP {String(i + 1).padStart(2, "0")}</div><div style={{ marginTop: 12, font: `600 17px ${SANS}`, lineHeight: 1.2 }}>{step}</div></div>; })}</div></Frame>;
    case "menu-reveal":
      return <Frame p={p} pal={pal} dark><div style={{ position: "absolute", inset: "7vh 11vw", border: `1px solid ${pal.secondary}77`, padding: "6vh 7vw", background: `linear-gradient(135deg, ${pal.primary}44, ${pal.bg}ee)` }}><div style={{ textAlign: "center" }}><Label pal={pal} accent={accent}>MENU / {p.restaurant || "HOUSE"}</Label><h1 style={{ margin: "30px 0 10px", font: `700 clamp(52px, 8vw, 120px) ${SERIF}` }}>{p.category || "Seasonal menu"}</h1><div style={{ color: pal.secondary, font: `16px ${MONO}`, letterSpacing: "0.16em" }}>{p.location || "OPEN TONIGHT"}</div></div><div style={{ marginTop: 60, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px 70px" }}>{menu.slice(0, 6).map((item, i) => <div key={`${item}-${i}`} style={{ display: "flex", justifyContent: "space-between", gap: 20, borderBottom: `1px solid ${pal.secondary}44`, paddingBottom: 13, color: pal.text, font: `22px ${SERIF}`, opacity: 0.45 + Math.min(0.55, progress * 1.4 - i * 0.08) }}><span>{item}</span><span style={{ color: accent, font: `600 14px ${MONO}` }}>{i % 2 ? "CHEF'S" : "SIGNATURE"}</span></div>)}</div></div></Frame>;
    case "chef-intro":
      return <Frame p={p} pal={pal}><div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 75% 38%, ${accent}55, transparent 28%), linear-gradient(115deg, ${pal.bg}, ${pal.primary}88)` }} /><div style={{ position: "absolute", left: "8vw", top: "12vh", maxWidth: "47vw" }}><Label pal={pal} accent={accent}>THE CHEF / {p.restaurant || "KITCHEN"}</Label><h1 style={{ margin: "28px 0 16px", font: `700 clamp(55px, 9vw, 144px) ${SERIF}`, lineHeight: 0.88 }}>{p.chef || "Mara Bell"}</h1><div style={{ font: `22px ${SANS}`, color: pal.secondary, maxWidth: 430 }}>{p.subtitle || "A seasonal point of view, built one plate at a time."}</div></div><div style={{ position: "absolute", right: "8vw", top: "15vh", width: "34vw", height: "61vh", borderRadius: "44% 44% 18% 18%", overflow: "hidden", background: `${pal.secondary}44`, border: `8px solid ${pal.text}bb`, boxShadow: `20px 30px 0 ${accent}55` }}>{image ? <Img src={image} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", background: `radial-gradient(circle at 50% 34%, ${pal.secondary} 0 15%, transparent 16%), radial-gradient(ellipse at 50% 75%, ${accent} 0 25%, transparent 26%), linear-gradient(150deg, ${pal.primary}, ${pal.bg})` }} />}</div><div style={{ position: "absolute", left: "8vw", bottom: "9vh", color: pal.secondary, font: `700 13px ${MONO}`, letterSpacing: "0.14em" }}>CRAFT · SEASON · MEMORY</div></Frame>;
    case "texture-close":
      return <Frame p={p} pal={pal} dark><FoodField p={{ ...p, imageUrl: image }} pal={pal} dark /><div style={{ position: "absolute", inset: "10vh 8vw", display: "flex", flexDirection: "column", justifyContent: "space-between" }}><Label pal={pal} accent={accent}>TEXTURE STUDY / 01</Label><div><div style={{ font: `700 clamp(58px, 10vw, 160px) ${SERIF}`, lineHeight: 0.83, maxWidth: "70vw" }}>{dishName}</div><div style={{ marginTop: 24, color: pal.text, font: `20px ${SANS}`, maxWidth: 500 }}>{p.caption || "Listen for the crackle, then let the finish linger."}</div></div></div><div style={{ position: "absolute", right: "8vw", top: "12vh", width: 110, height: 110, borderRadius: "50%", border: `1px solid ${accent}`, display: "grid", placeItems: "center", color: accent, font: `700 12px ${MONO}`, letterSpacing: "0.1em" }}>MACRO</div></Frame>;
    case "plating-build":
      return <Frame p={p} pal={pal}><div style={{ position: "absolute", inset: 0, background: `linear-gradient(155deg, ${pal.bg}, ${pal.primary}44)` }} /><div style={{ position: "absolute", left: "7vw", top: "8vh" }}><Label pal={pal} accent={accent}>PLATING / FINAL PASS</Label><div style={{ marginTop: 24, font: `700 clamp(44px, 7vw, 108px) ${SERIF}`, maxWidth: "42vw" }}>{dishName}</div></div><div style={{ position: "absolute", left: "50%", top: "52%", transform: "translate(-50%, -50%)" }}><Plate pal={pal} accent={accent} scale={1.2} garnish={10} /></div>{Array.from({ length: 4 }, (_, i) => <div key={`callout-${i}`} style={{ position: "absolute", left: `${8 + (i % 2) * 66}vw`, top: `${34 + Math.floor(i / 2) * 29}vh`, color: pal.text, font: `600 15px ${MONO}`, letterSpacing: "0.1em" }}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: i % 2 ? pal.secondary : accent, marginRight: 10 }} />{ingredients[i % ingredients.length]}</div>)}</Frame>;
    case "restaurant-card":
      return <Frame p={p} pal={pal}><FoodField p={p} pal={pal} /><div style={{ position: "absolute", left: "9vw", bottom: "10vh", width: "min(680px, 72vw)", padding: "34px 38px", background: `${pal.bg}e8`, borderLeft: `5px solid ${accent}` }}><Label pal={pal} accent={accent}>RESTAURANT / {p.category || "DINING"}</Label><h1 style={{ margin: "22px 0 8px", font: `700 clamp(45px, 7vw, 104px) ${SERIF}`, lineHeight: 0.9 }}>{p.restaurant || "The Green Table"}</h1><div style={{ color: pal.secondary, font: `18px ${MONO}`, letterSpacing: "0.08em" }}>{p.location || "12 MARKET STREET"}</div><div style={{ marginTop: 22, font: `24px ${SANS}` }}>{dishName}</div><div style={{ marginTop: 14, color: accent, font: `700 20px ${MONO}` }}>{p.price || "$24"}</div></div></Frame>;
    case "nutrition-card":
      return <Frame p={p} pal={pal}><div style={{ position: "absolute", left: "8vw", top: "9vh" }}><Label pal={pal} accent={accent}>NUTRITION / PER SERVING</Label><h1 style={{ margin: "25px 0 0", font: `700 clamp(48px, 8vw, 122px) ${SERIF}`, lineHeight: 0.9 }}>{dishName}</h1></div><div style={{ position: "absolute", left: "8vw", right: "8vw", bottom: "11vh", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 46, alignItems: "end" }}><div>{nutrition.slice(0, 5).map((item, i) => <div key={`${item.label}-${i}`} style={{ marginTop: 16 }}><div style={{ display: "flex", justifyContent: "space-between", font: `600 16px ${MONO}` }}><span>{item.label}</span><span style={{ color: accent }}>{item.value}</span></div><div style={{ marginTop: 7, height: 8, background: `${pal.secondary}33`, borderRadius: 8 }}><div style={{ height: "100%", width: `${Math.max(4, Math.min(100, item.amount * 100))}%`, background: `linear-gradient(90deg, ${accent}, ${pal.secondary})`, borderRadius: 8 }} /></div></div>)}</div><div style={{ justifySelf: "center" }}><Plate pal={pal} accent={accent} scale={0.78} /></div></div></Frame>;
    case "dish-carousel":
      return <Frame p={p} pal={pal}><div style={{ position: "absolute", left: "7vw", top: "8vh" }}><Label pal={pal} accent={accent}>DISHES / {p.restaurant || "SEASONAL"}</Label><h1 style={{ margin: "24px 0 0", font: `700 clamp(45px, 7vw, 104px) ${SERIF}` }}>{p.category || "Tonight's table"}</h1></div><div style={{ position: "absolute", left: "7vw", right: "7vw", bottom: "9vh", display: "flex", gap: 24, transform: `translateX(${(1 - progress) * 80}px)` }}>{(p.dishImages?.length ? p.dishImages : [undefined, undefined, undefined]).slice(0, 3).map((src, i) => <div key={`dish-${i}`} style={{ flex: 1, minHeight: 224, padding: 18, background: `${pal.primary}88`, border: `1px solid ${pal.secondary}55`, transform: `translateY(${Math.sin(frame * 0.025 + i) * 6}px)` }}>{src ? <Img src={src} style={{ width: "100%", height: 140, objectFit: "cover" }} /> : <div style={{ height: 140, background: `radial-gradient(circle at 46% 46%, ${i % 2 ? accent : pal.secondary} 0 16%, transparent 17%), linear-gradient(135deg, ${pal.bg}, ${pal.primary})` }} />}<div style={{ marginTop: 16, color: accent, font: `700 12px ${MONO}` }}>0{i + 1} / {p.category || "DISH"}</div><div style={{ marginTop: 8, font: `24px ${SERIF}` }}>{menu[i] || ["Starter", "Main course", "Dessert"][i]}</div></div>)}</div></Frame>;
    case "food-finale":
    default:
      return <Frame p={p} pal={pal} dark><FoodField p={{ ...p, imageUrl: image }} pal={pal} dark /><div style={{ position: "absolute", left: "7vw", top: "9vh" }}><Label pal={pal} accent={accent}>FOOD FILM / {p.restaurant || "THE TABLE"}</Label></div><div style={{ position: "absolute", left: "7vw", bottom: "10vh", maxWidth: "70vw" }}><div style={{ color: accent, font: `700 14px ${MONO}`, letterSpacing: "0.15em" }}>{p.category || "A SEASONAL STORY"}</div><h1 style={{ margin: "18px 0 0", font: `700 clamp(62px, 11vw, 180px) ${SERIF}`, lineHeight: 0.82, maxWidth: "50vw" }}>{dishName}</h1><div style={{ marginTop: 24, color: pal.text, font: `22px ${SANS}`, maxWidth: "48vw" }}>{p.subtitle || p.caption || "Made slowly. Shared generously."}</div><div style={{ marginTop: 20, color: pal.secondary, font: `700 13px ${MONO}`, letterSpacing: "0.12em" }}>{p.location || "KITCHEN NOTES"} · {p.price || "SERVE WARM"}</div></div><div style={{ position: "absolute", right: "9vw", top: "16vh" }}><Plate pal={pal} accent={accent} scale={0.66} /></div></Frame>;
  }
};

export const FoodFilms: React.FC<{ p: FoodFilmsProps; pal: Palette }> = ({ p, pal }) => <FoodRenderer p={p} pal={pal} />;

const familyCast = (variant: FoodVariant) => ((props: Record<string, unknown>) => {
  const p = { ...(props as unknown as FoodFilmsProps), variant };
  return <FoodFilms p={p} pal={resolvePalette(p.paletteName ?? "sunset")} />;
}) as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "food-films-ingredient-pour": familyCast("ingredient-pour"),
  "food-films-recipe-steps": familyCast("recipe-steps"),
  "food-films-menu-reveal": familyCast("menu-reveal"),
  "food-films-chef-intro": familyCast("chef-intro"),
  "food-films-texture-close": familyCast("texture-close"),
  "food-films-plating-build": familyCast("plating-build"),
  "food-films-restaurant-card": familyCast("restaurant-card"),
  "food-films-nutrition-card": familyCast("nutrition-card"),
  "food-films-dish-carousel": familyCast("dish-carousel"),
  "food-films-food-finale": familyCast("food-finale"),
};
