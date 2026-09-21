import Link from "next/link";
export default function NotFound() {
  return (
    <>
      <h1>Nothing here</h1>
      <p className="lede">That page doesn't exist, or the election it referred to isn't loaded.</p>
      <p><Link href="/" className="button">Go to the elections we cover</Link></p>
    </>
  );
}
