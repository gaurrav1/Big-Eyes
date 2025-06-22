import { Tile } from "../general/Tile/Tile";

export function Lists() {
  return (
    <div>
        <Tile tile={{title: "Location", description: "Select a location"}} />
        <hr />
        <Tile tile={{title: "Shift Type", description: "Select a shift type"}} />
    </div>
  )
}
