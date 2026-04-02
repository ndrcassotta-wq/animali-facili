type FaqItemProps = {
  question: string
  answer: string
}

export function FaqItem({ question, answer }: FaqItemProps) {
  return (
    <details className="group rounded-2xl border border-border bg-card p-4 shadow-sm">
      <summary className="cursor-pointer list-none pr-8 font-medium text-foreground">
        {question}
      </summary>
      <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">{answer}</p>
    </details>
  )
}