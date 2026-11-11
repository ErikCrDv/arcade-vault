import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GAMES, getGame } from "@/lib/data";
import { GamePlayer } from "@/components/game-player";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/juegos/[id]/jugar">): Promise<Metadata> {
  const { id } = await params;
  const game = getGame(id);
  return game ? { title: `${game.title} · Jugar · Arcade Vault` } : {};
}

export default async function PlayPage({
  params,
}: PageProps<"/juegos/[id]/jugar">) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();

  return <GamePlayer game={game} />;
}
