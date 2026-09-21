export const metadata = { title: "Moderation" };
export default function Moderation() {
  return (
    <>
      <h1>What we publish, hold or refuse</h1>
      <p className="lede">Applies to statements submitted by candidates and to anything we draft from a source.</p>
      <h2>Refused</h2>
      <ul><li>Content about another person's private life, health or family.</li><li>Statements we judge likely to be defamatory of a named person.</li><li>Hate speech or incitement.</li><li>Material off the nine topics, or that is not a position (slogans without content are published verbatim but not summarised).</li></ul>
      <h2>Edited</h2>
      <p>Spelling only, and only where the meaning cannot change. Nothing else is edited; corrections are made by superseding entries in the public ledger with the reason shown.</p>
      <h2>Held</h2>
      <p>A submission is held when the cited URL does not show the statement, or when it falls under a refusal reason. The candidate is told which, by the contact route they used, and may resubmit.</p>
      <h2>Complaints and corrections</h2>
      <p>Anyone may ask for a correction. Every complaint and its outcome is logged publicly on the ledger, whether or not anything changes.</p>
    </>
  );
}
