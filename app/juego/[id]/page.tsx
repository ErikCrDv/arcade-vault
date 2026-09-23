import { notFound } from "next/navigation";
import { GAMES } from "@/lib/data";
import GameDetail from "@/components/GameDetail";

export default async function GamePage(props: PageProps<"/juego/[id]">) {
  const { id } = await props.params;
  const game = GAMES.find((g) => g.id === id);

  if (!game) notFound();

  return <GameDetail game={game} />;
}
