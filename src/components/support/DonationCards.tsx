import { DONATION_LINKS, VENMO_AVAILABLE } from "@/lib/donations";
import { BuyMeACoffeeIcon, VenmoIcon } from "@/components/support/DonationIcons";

export function DonationCards() {
  return (
    <div
      id="ways-to-give"
      className="grid scroll-mt-24 gap-4 sm:grid-cols-2"
    >
      <article className="interactive-card p-5">
        <VenmoIcon className="h-10 w-10" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">Venmo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Support Politeia through Venmo.
        </p>
        {VENMO_AVAILABLE ? (
          <a
            href={DONATION_LINKS.venmo}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Donate with Venmo
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="mt-5 inline-flex w-full cursor-not-allowed items-center justify-center rounded-md border border-border bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground"
          >
            Coming soon
          </button>
        )}
      </article>

      <article className="interactive-card p-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted/60 text-muted-foreground">
          <BuyMeACoffeeIcon className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          Buy Me a Coffee
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Support Politeia through Buy Me a Coffee.
        </p>
        <a
          href={DONATION_LINKS.buyMeACoffee}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Donate with Buy Me a Coffee
        </a>
      </article>
    </div>
  );
}
