import { LoaderCircle } from 'lucide-react'

// Small rotating icon for loading buttons and loading text
export default function Spinner({ size = 16 }) {
  return <LoaderCircle className="spinner" size={size} aria-hidden="true" />
}
