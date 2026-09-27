// "Write to your councillor, MP or other representatives": a plain link to mySociety's WriteToThem, the same for every
// area (docs/automation/open-data-mysociety.md, section 4). No postcode is ever put in the URL: the site's rule is that a
// full postcode never travels in a link, and we do not keep it after the lookup. `a=council` on council pages narrows
// WriteToThem's choice to the person's councillors; elsewhere they choose. fyr_extref tells WriteToThem where people came from.
export default function WriteToThem({ council = false }: { council?: boolean }) {
  const href = `https://www.writetothem.com/?${council ? "a=council&" : ""}fyr_extref=${encodeURIComponent("https://whatsittome.org")}`;
  return (
    <p className="small write-to-them"><a href={href} rel="noopener">Write to your councillor{council ? "s" : ", MP or other representatives"} &rarr;</a> <span className="meta">WriteToThem (mySociety) finds them from your postcode; nothing is sent through this site.</span></p>
  );
}
