// Fixed layer behind the page content that tones the background glows
// down (to about 60%), so photos stay the focus on the feed and photo pages.
export default function BackdropDim() {
  return <div className="backdrop-dim" aria-hidden="true" />
}
