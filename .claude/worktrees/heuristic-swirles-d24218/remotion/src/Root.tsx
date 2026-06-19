import { Composition } from "remotion";
import { CountUp } from "./compositions/CountUp";
import { MoneyFlow } from "./compositions/MoneyFlow";
import { Timeline } from "./compositions/Timeline";
import { VerdictStamp } from "./compositions/VerdictStamp";
import { ChartBar } from "./compositions/ChartBar";
import { SourceCard } from "./compositions/SourceCard";
import { ClirosWelcome } from "./compositions/ClirosWelcome";
import { ClirosAOLDesk } from "./compositions/ClirosAOLDesk";
// NT Ministry v8 compositions
import { OpeningSlate } from "./compositions/OpeningSlate";
import { ClosingSlate } from "./compositions/ClosingSlate";
import { ChapterStrip } from "./compositions/ChapterStrip";
import { OverturnedLaw } from "./compositions/OverturnedLaw";
import { BiblicalMap } from "./compositions/BiblicalMap";
import { DonorComparison } from "./compositions/DonorComparison";
import { PoliticalMap } from "./compositions/PoliticalMap";
import { EstimateProofHero } from "./compositions/EstimateProofHero";
// 2026-05-23 — HealthBrew Tracker pivot
import { HealthBrewGreenDay } from "./compositions/HealthBrewGreenDay";
import { HealthBrewProductHero } from "./compositions/HealthBrewProductHero";
// 2026-05-25 — HealthBrew Ep.2 closing card (15s app-UI showcase)
import { HealthBrewCloseTheDay } from "./compositions/HealthBrewCloseTheDay";
// 2026-05-22 — NT Ministry v9 compositions (cinematic-direction.md rules 12, 15)
import { TextSlate } from "./compositions/TextSlate";
import { LowerThird } from "./compositions/LowerThird";
import { ExplainerThreeStories } from "./compositions/ExplainerThreeStories";
import {
  GuessPriceCountdown,
  GuessPriceReveal,
  GuessPriceGameShowReveal,
  GuessPriceConfettiReveal,
  DealerReceiptCard,
  EstimateProofCtaCard,
  GUESS_SHORT_FPS,
  GUESS_SHORT_W,
  GUESS_SHORT_H,
} from "./compositions/GuessPriceShort";
// 2026-05-29 — Campaign Receipts reusable Shorts intro/outro (9:16)
import { ShortsIntro } from "./compositions/ShortsIntro";
import { ShortsSubscribeOutro } from "./compositions/ShortsSubscribeOutro";
import { LongformSubscribeOutro } from "./compositions/LongformSubscribeOutro";
import { allEpisodeCompositionNodes } from "./episodes/registry";

// Canonical render dimensions: 1280×720 @ 30fps.
// Adapter (scripts/pipeline/render-remotion.mjs) overrides durationInFrames
// per-call via --duration; defaults below are sane preview values for
// `npx remotion studio`.

const FPS = 30;
const W = 1280;
const H = 720;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CountUp"
        component={CountUp}
        durationInFrames={FPS * 60}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{
          brand: "sealed",
          from: 0,
          to: 82000000,
          prefix: "$",
          label: "ADELSON, 2016 CYCLE",
          caption: "Republican-aligned committees (FEC)",
          easing: "out" as const,
        }}
      />
      <Composition
        id="MoneyFlow"
        component={MoneyFlow}
        durationInFrames={FPS * 60}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{
          brand: "sealed",
          title: "Where the money went",
          source: { name: "Adelson", amount: 82000000, sublabel: "Republican-aligned committees, 2016 cycle" },
          destinations: [
            { label: "Iran deal killed", outcome: "EO May 2018" },
            { label: "Embassy moved to Jerusalem", outcome: "Dec 2017" },
            { label: "EO 13899 signed", outcome: "Dec 2019" },
          ],
        }}
      />
      <Composition
        id="Timeline"
        component={Timeline}
        durationInFrames={FPS * 60}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{
          brand: "sealed",
          title: "Promise → Outcome",
          events: [
            { date: "Oct 2015", label: "Promise made", outcome: "READER" },
            { date: "Jan 2017", label: "Inauguration", outcome: "PARTIAL" },
            { date: "May 2018", label: "Iran deal exit", outcome: "KEPT" },
            { date: "Dec 2019", label: "EO 13899", outcome: "KEPT" },
          ],
        }}
      />
      <Composition
        id="VerdictStamp"
        component={VerdictStamp}
        durationInFrames={FPS * 60}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{
          brand: "campaign-receipts",
          verdict: "RECEIPT",
          promise: "",
          citation: "",
          rotationDeg: -8,
        }}
      />
      <Composition
        id="ChartBar"
        component={ChartBar}
        durationInFrames={FPS * 60}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{
          brand: "sealed",
          title: "2016 cycle giving",
          yAxisLabel: "$ millions",
          bars: [
            { label: "Adelson", value: 82, prefix: "$", suffix: "M" },
            { label: "Mercer", value: 25, prefix: "$", suffix: "M" },
            { label: "Singer", value: 26, prefix: "$", suffix: "M" },
            { label: "Ricketts", value: 12, prefix: "$", suffix: "M" },
          ],
        }}
      />
      <Composition
        id="SourceCard"
        component={SourceCard}
        durationInFrames={FPS * 60}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{
          brand: "sealed",
          citation: "Heilbrunn (2008)",
          page: "p. 142",
          quote: "The neoconservative project was always about reshaping the region — Iran was the prize.",
          source: "They Knew They Were Right",
          url: "",
        }}
      />
      <Composition
        id="PoliticalMap"
        component={PoliticalMap}
        durationInFrames={FPS * 15}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{
          brand: "sealed",
          region: "jcpoa" as const,
          title: "WHO SIGNED THE IRAN DEAL",
          subtitle: "P5+1 + EU + Iran · 2015",
          markers: [
            { label: "USA", x: 18, y: 42, appearAt: 0.5, color: "accent" as const },
            { label: "UK", x: 38, y: 28, appearAt: 1.0, color: "muted" as const },
            { label: "France", x: 42, y: 38, appearAt: 1.2, color: "muted" as const },
            { label: "Germany", x: 48, y: 32, appearAt: 1.4, color: "muted" as const },
            { label: "Russia", x: 62, y: 22, appearAt: 1.6, color: "muted" as const },
            { label: "China", x: 78, y: 38, appearAt: 1.8, color: "muted" as const },
            { label: "Iran", x: 58, y: 58, appearAt: 2.2, color: "highlight" as const },
          ],
        }}
      />
      <Composition
        id="DonorComparison"
        component={DonorComparison}
        durationInFrames={FPS * 15}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{
          brand: "sealed",
          title: "Mega-donors across the spectrum",
          subtitle: "2016 cycle · FEC / OpenSecrets",
          footer: "We follow the paper.",
          rows: [
            { name: "Adelson", amount: "$82M", cycle: "2016", policy: "Iran deal · embassy · EO 13899", highlight: true },
            { name: "Steyer", amount: "~$91M", cycle: "2016", policy: "Climate · progressive ballot measures" },
            { name: "Soros", amount: "~$25M", cycle: "2016", policy: "Judicial · voter access · civil society" },
            { name: "Bloomberg", amount: "~$24M", cycle: "2016", policy: "Gun safety · climate" },
            { name: "Saban", amount: "~$14M", cycle: "2016", policy: "Pro-Israel Democrats" },
            { name: "Hoffman", amount: "~$8M", cycle: "2016", policy: "Tech-friendly Democrats" },
          ],
        }}
      />
      {/* Cliros welcome / explainer — 60s programmatic explainer played
          in the dashboard when an attorney lands after their 5 free
          reports are used. Renders 1800 frames @ 30fps = 60s. */}
      <Composition
        id="ClirosWelcome"
        component={ClirosWelcome}
        durationInFrames={1800}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ brand: "cliros" }}
      />

      {/* ============== NT Ministry Ep1 v8 compositions ============== */}
      <Composition
        id="OpeningSlate"
        component={OpeningSlate}
        durationInFrames={FPS * 4}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          brand: "nt-ministry",
          text: "My brother never said God did those things.",
          fadeInDelay: 0,
          holdSeconds: 4,
        }}
      />
      <Composition
        id="ClosingSlate"
        component={ClosingSlate}
        durationInFrames={FPS * 5}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          brand: "nt-ministry",
          name: "James of Jerusalem",
          detail: "d. 62 AD",
        }}
      />
      <Composition
        id="ChapterStrip"
        component={ChapterStrip}
        durationInFrames={FPS * 4}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          brand: "nt-ministry",
          text: "01 · THE TENSION YOU FELT WAS REAL",
          heightPercent: 6,
          slideInSeconds: 0.35,
          holdSeconds: 3.5,
          slideOutSeconds: 0.35,
        }}
      />
      <Composition
        id="OverturnedLaw"
        component={OverturnedLaw}
        durationInFrames={FPS * 16}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          brand: "nt-ministry",
          oldLawTitle: "EYE FOR AN EYE",
          oldLawCitations: ["Exodus 21", "Leviticus 24", "Deuteronomy 19"],
          newLawTitle: "TURN THE OTHER CHEEK",
          newLawCitation: "Matthew 5:38-39",
        }}
      />
      <Composition
        id="BiblicalMap"
        component={BiblicalMap}
        durationInFrames={FPS * 15}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          brand: "nt-ministry",
          region: "canaan" as const,
          title: "ANCIENT CANAAN",
          markers: [
            { label: "Joshua", x: 32, y: 35, appearAt: 1.5, color: "red" as const },
            { label: "Judges", x: 28, y: 50, appearAt: 3.0, color: "red" as const },
            { label: "Amalekites", x: 42, y: 75, appearAt: 4.5, color: "red" as const },
            { label: "Canaanites", x: 22, y: 22, appearAt: 6.0, color: "red" as const },
          ],
        }}
      />
      <Composition
        id="ClirosAOLDesk"
        component={ClirosAOLDesk}
        durationInFrames={FPS * 8}
        fps={FPS}
        width={960}
        height={540}
        defaultProps={{ brand: "cliros" }}
      />
      <Composition
        id="EstimateProofHero"
        component={EstimateProofHero}
        durationInFrames={FPS * 12}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ carImage: "hero-car.png" }}
      />

      {/* ============== NT Ministry v9 compositions (cinematic-direction.md) ============== */}
      {/* Rule 15 — replaces PIL+ffmpeg black-slate-text. */}
      <Composition
        id="TextSlate"
        component={TextSlate}
        durationInFrames={FPS * 6}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          brand: "nt-ministry",
          text: "The book they burned.",
          variant: "quiet" as const,
          wrapWidth: 28,
        }}
      />
      {/* Rule 12 — character introduction chyron. */}
      <Composition
        id="LowerThird"
        component={LowerThird}
        durationInFrames={FPS * 4}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          brand: "nt-ministry",
          name: "Miriam",
          role: "disciple",
        }}
      />
      {/* Rule 15 — sparse "three stories" explainer; max 3 cards × 5s = 15s. */}
      <Composition
        id="ExplainerThreeStories"
        component={ExplainerThreeStories}
        durationInFrames={FPS * 15}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          brand: "nt-ministry",
          cardSeconds: 5,
          items: [
            { numeral: "I",  headline: "The flood",  body: "A god drowns the world.", symbol: "stone-window" as const },
            { numeral: "II", headline: "The conquest",  body: "Armies told to kill children.", symbol: "scroll" as const },
            { numeral: "III", headline: "The fire",  body: "A father asked to kill his son.", symbol: "oil-lamp" as const },
          ],
        }}
      />

      {/* EstimateProof guess-the-price Shorts (9:16) */}
      <Composition
        id="GuessPriceCountdown"
        component={GuessPriceCountdown}
        durationInFrames={GUESS_SHORT_FPS * 5}
        fps={GUESS_SHORT_FPS}
        width={GUESS_SHORT_W}
        height={GUESS_SHORT_H}
        defaultProps={{ brand: "estimateproof" }}
      />
      <Composition
        id="GuessPriceReveal"
        component={GuessPriceReveal}
        durationInFrames={GUESS_SHORT_FPS * 6}
        fps={GUESS_SHORT_FPS}
        width={GUESS_SHORT_W}
        height={GUESS_SHORT_H}
        defaultProps={{
          brand: "estimateproof",
          mode: "single",
          vehicleLabel: "2019 Toyota Camry",
          asking: 14200,
          fairLow: 12800,
          fairHigh: 15400,
        }}
      />
      <Composition
        id="GuessPriceGameShowReveal"
        component={GuessPriceGameShowReveal}
        durationInFrames={GUESS_SHORT_FPS * 6}
        fps={GUESS_SHORT_FPS}
        width={GUESS_SHORT_W}
        height={GUESS_SHORT_H}
        defaultProps={{
          brand: "estimateproof",
          doorNumber: 1,
          vehicleLabel: "2007 Lamborghini Gallardo Spyder",
          asking: 114995,
          fairLow: 103495,
          fairHigh: 124194,
        }}
      />
      <Composition
        id="GuessPriceConfettiReveal"
        component={GuessPriceConfettiReveal}
        durationInFrames={GUESS_SHORT_FPS * 5}
        fps={GUESS_SHORT_FPS}
        width={GUESS_SHORT_W}
        height={GUESS_SHORT_H}
        defaultProps={{
          brand: "estimateproof",
          vehicleLabel: "2007 Lamborghini Gallardo Spyder",
          asking: 114995,
          fairLow: 103495,
          fairHigh: 124194,
        }}
      />
      <Composition
        id="DealerReceiptCard"
        component={DealerReceiptCard}
        durationInFrames={GUESS_SHORT_FPS * 5}
        fps={GUESS_SHORT_FPS}
        width={GUESS_SHORT_W}
        height={GUESS_SHORT_H}
        defaultProps={{
          brand: "estimateproof",
          dealerName: "Ellingson Motorcars",
          street: "20950 Rogers Drive",
          cityStateZip: "Rogers, MN 55374",
          phone: "(763) 428-7337",
          stockNo: "9043",
        }}
      />
      <Composition
        id="EstimateProofCtaCard"
        component={EstimateProofCtaCard}
        durationInFrames={GUESS_SHORT_FPS * 4}
        fps={GUESS_SHORT_FPS}
        width={GUESS_SHORT_W}
        height={GUESS_SHORT_H}
        defaultProps={{
          brand: "estimateproof",
          headline: "See similar cars near you",
          url: "estimateproof.com/worth/example",
        }}
      />
      {/* ============== HealthBrew Tracker ============== */}
      <Composition
        id="HealthBrewGreenDay"
        component={HealthBrewGreenDay}
        durationInFrames={FPS * 8}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{
          brand: "healthbrew",
          label: "Brew more green days.",
          soundMind: 82,
          soundBody: 76,
          greenDayCount: 23,
        }}
      />
      <Composition
        id="HealthBrewGreenDayLandscape"
        component={HealthBrewGreenDay}
        durationInFrames={FPS * 8}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          brand: "healthbrew",
          label: "Brew more green days.",
          soundMind: 82,
          soundBody: 76,
          greenDayCount: 23,
        }}
      />
      <Composition
        id="HealthBrewProductHero"
        component={HealthBrewProductHero}
        durationInFrames={1}
        fps={1}
        width={1080}
        height={1080}
        defaultProps={{
          brand: "healthbrew",
          headline: "Brew more good days.",
          subline: "A nightly habit tracker & journal.",
        }}
      />

      {/* HealthBrew Ep.2 "She Stopped Eating Over the Sink" — 15s closing card */}
      <Composition
        id="HealthBrewCloseTheDay"
        component={HealthBrewCloseTheDay}
        durationInFrames={FPS * 15}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          brand: "healthbrew",
        }}
      />

      {/* ============== Campaign Receipts reusable Shorts intro / outro ==============
          Founder lock 2026-05-29: every CR Short (now + future) gets a branded
          intro + subscribe outro. Reusable one-time assets — rendered once to
          companies/campaign-receipts/brand/{shorts-intro,shorts-subscribe-outro}.mp4
          and spliced onto each Short. 9:16 vertical, sober ledger aesthetic. */}
      <Composition
        id="ShortsIntro"
        component={ShortsIntro}
        durationInFrames={FPS * 2}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{
          brand: "campaign-receipts",
          wordmark: "Campaign Receipts",
          tagline: "Receipts, not vibes.",
        }}
      />
      <Composition
        id="ShortsSubscribeOutro"
        component={ShortsSubscribeOutro}
        durationInFrames={FPS * 3}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{
          brand: "campaign-receipts",
          handle: "@campaignreceipts",
          cta: "Follow the money with us",
          buttonLabel: "SUBSCRIBE",
        }}
      />
      <Composition
        id="LongformSubscribeOutro"
        component={LongformSubscribeOutro}
        durationInFrames={FPS * 5}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          brand: "campaign-receipts",
          handle: "@campaignreceipts",
          cta: "Follow the money with us",
          buttonLabel: "SUBSCRIBE",
          newsletterUrl: "campaignreceipts.com/weekly",
        }}
      />

      {/* ============== Episode-scoped compositions (founder lock 2026-05-23) ==============
          Pipeline renders `{slug}__{name}` — see remotion/src/episodes/README.md.
          Storyboard clips keep short names; render-remotion.mjs adds the slug prefix. */}
      {allEpisodeCompositionNodes()}
    </>
  );
};
