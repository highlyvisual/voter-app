import ProfileView from "@/components/ProfileView";
import { findElection } from "../find/actions";
export const metadata = { title: "My profile" };
export const dynamic = "force-dynamic";
export default function Profile() {
  return (
    <>
      <p className="eyebrow">On this device only</p>
      <h1>My profile</h1>
      <p className="lede">Everything we use to show what applies to a household like yours — each answer, why we ask it, and one tap to change it. No account, no email, nothing kept by us.</p>
      <ProfileView findAction={findElection} />
    </>
  );
}
