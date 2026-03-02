import Link from "next/link"

export default function BackButtonServer() {
  return (
    <button
      onClick={() => {
        if (typeof window !== 'undefined') {
          window.history.back()
        }
      }}
      className="backButton"
    >
      ← Back
    </button>
  )
}
