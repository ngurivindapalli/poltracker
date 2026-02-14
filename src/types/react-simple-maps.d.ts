declare module 'react-simple-maps' {
  import { ReactNode } from 'react'

  export interface Geography {
    rsmKey: string
    properties: {
      name?: string
      STUSPS?: string
      [key: string]: any
    }
    id?: string
    [key: string]: any
  }

  export interface ComposableMapProps {
    projection?: string
    className?: string
    style?: React.CSSProperties
    children?: ReactNode
  }

  export interface GeographiesProps {
    geography: string | object
    children: (args: { geographies: Geography[] }) => ReactNode
  }

  export interface GeographyProps {
    geography: Geography
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: {
      default?: React.CSSProperties
      hover?: React.CSSProperties
      pressed?: React.CSSProperties
    }
    onMouseEnter?: () => void
    onMouseLeave?: () => void
    onClick?: (e?: any) => void
    key?: string
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element
  export function Geographies(props: GeographiesProps): JSX.Element
  export function Geography(props: GeographyProps): JSX.Element
}
