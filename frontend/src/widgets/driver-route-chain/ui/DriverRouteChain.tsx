type Props = {
  chain: string
}

export const DriverRouteChain = ({ chain }: Props) => {
  if (!chain) return null

  return (
    <p className="px-1 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
      {chain}
    </p>
  )
}
