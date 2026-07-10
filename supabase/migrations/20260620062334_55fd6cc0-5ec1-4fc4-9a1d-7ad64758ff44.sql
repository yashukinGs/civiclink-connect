-- Restrict helper functions to signed-in users only
REVOKE EXECUTE ON FUNCTION public.get_issue_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_issue_stats() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_issue_by_ticket(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_issue_by_ticket(text) TO authenticated;

-- Replace always-true contact insert policy with real validation
DROP POLICY "Anyone can submit a contact message" ON public.contact_messages;

CREATE POLICY "Anyone can submit a valid contact message"
ON public.contact_messages FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(trim(name)) > 0
  AND char_length(trim(email)) > 0
  AND char_length(trim(subject)) > 0
  AND char_length(trim(message)) > 0
  AND char_length(name) <= 100
  AND char_length(email) <= 255
  AND char_length(subject) <= 150
  AND char_length(message) <= 2000
);