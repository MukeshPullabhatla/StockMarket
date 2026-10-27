import { useEffect } from 'react'
import { OWNER_NAME } from '../siteConfig'

const HOME_TITLE = `${OWNER_NAME} — AI Engineer`

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${OWNER_NAME}` : HOME_TITLE
  }, [title])
}
