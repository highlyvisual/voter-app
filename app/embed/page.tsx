import Link from "next/link";
import { EmbedPreview, EmbedSnippet } from "@/components/EmbedSnippet";

export const metadata = {
  title: "Put “Your next election” on your site",
  description: "A free box for your website: people type a postcode and see the elections coming up there. No cookies, no tracking, nothing stored.",
  alternates: { canonical: "/embed" },
};

// For publishers (Romily, round ten, q8: local news, schools, charities and councils). Peter Keeling of Democracy Club
// suggested widgets: 3.8% of Democracy Club's postcode searches come through them. Linked from /about only, not the menus.
const BASIC = `<iframe src="https://whatsittome.org/embed/next-election" title="Your next election" width="100%" height="360" style="border:0" loading="lazy"></iframe>`;
const RESIZING = `<iframe id="wim-next-election" src="https://whatsittome.org/embed/next-election" title="Your next election" width="100%" height="360" style="border:0" loading="lazy"></iframe>
<script>addEventListener("message",function(e){var f=document.getElementById("wim-next-election");if(e.origin==="https://whatsittome.org"&&f&&e.source===f.contentWindow&&e.data&&e.data.whatsittome==="next-election"&&typeof e.data.height==="number")f.style.height=Math.min(Math.max(e.data.height,200),1600)+"px"});</script>`;

export default function EmbedPage() {
  return (
    <>
      <p className="eyebrow">For websites</p>
      <h1>Put &ldquo;Your next election&rdquo; on your site</h1>
      <p className="lede">A small box for your website. Someone types their postcode and sees the elections coming up where they live, with the date and how many days are left.</p>
      <p>It is free, and it is for anyone: local news sites, schools, charities, councils and community groups.</p>

      <h2>What it looks like</h2>
      <p>This is the real box. Try a postcode.</p>
      <EmbedPreview />

      <h2>Add it to your site</h2>
      <p>Copy this into your page where you want the box to appear.</p>
      <EmbedSnippet code={BASIC} label="Code" />
      <details>
        <summary>A version that fits its height to the results</summary>
        <p>The box above has a fixed height of 360 pixels, so a long list of elections scrolls inside it. This version adds a short script that lets the box grow to fit. It only reads the box&rsquo;s height, nothing else.</p>
        <EmbedSnippet code={RESIZING} label="Resizing code" />
      </details>
      <p>It works from 300 pixels wide and follows the reader&rsquo;s light or dark setting. Each election links to its full page on whatsittome.org, which opens in a new tab.</p>

      <h2>What happens to the postcode</h2>
      <ul>
        <li>It is sent to us in the body of the request, never in a web address, and is not saved or logged.</li>
        <li>We check it with <a href="https://postcodes.io/">postcodes.io</a> (built on Office for National Statistics data, Open Government Licence) and look up the elections with <a href="https://democracyclub.org.uk/">Democracy Club</a>. Both see the postcode, as they do for any postcode search on this site. Neither is told which site the box is on.</li>
        <li>The box sets no cookies and stores nothing in the reader&rsquo;s browser. There is no tracking, no analytics and no advertising, and it loads nothing from anyone else.</li>
        <li>Links to election pages carry only the first half of the postcode (for example WC1H), never the whole thing.</li>
      </ul>
      <p className="small">More in <Link href="/about/data-use">how we use data</Link>.</p>

      <h2>What it does not do</h2>
      <p>It never ranks, scores or recommends a candidate or party. It shows only which elections are coming up and when. If no election is scheduled for a postcode yet, it says so.</p>

      <h2>Where the data comes from</h2>
      <p>Election names, places and dates come from <a href="https://democracyclub.org.uk/">Democracy Club</a>, under the Creative Commons Attribution licence (CC BY 4.0). The credit is built into the box, so please leave it in.</p>
      <p>Questions or problems: <a href="mailto:hello@whatsittome.org">hello@whatsittome.org</a>.</p>
    </>
  );
}
