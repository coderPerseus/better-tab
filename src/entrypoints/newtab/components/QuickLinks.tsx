export type QuickLink = {
  label: string
  url: string
}

type Props = {
  links: QuickLink[]
  ariaLabel?: string
}

const getFavicon = (url: string) => {
  try {
    const hostname = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`
  } catch {
    return ""
  }
}

export default function QuickLinks({ links, ariaLabel = "Shortcuts" }: Props) {
  return (
    <section className="shortcuts" aria-label={ariaLabel}>
      {links.map((link) => (
        <a key={link.url} className="shortcut" href={link.url} rel="noreferrer" target="_blank">
          <span className="shortcut-icon" aria-hidden="true">
            <img alt="" src={getFavicon(link.url)} loading="lazy" referrerPolicy="no-referrer" />
          </span>
          <span className="shortcut-label">{link.label}</span>
        </a>
      ))}
    </section>
  )
}
