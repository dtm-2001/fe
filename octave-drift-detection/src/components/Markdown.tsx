// components/Markdown.tsx
import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

export function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      children={content}
      rehypePlugins={[rehypeRaw]}
    />
  )
}
