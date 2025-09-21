-- Function to search for emails by first name, filtered by university domain and excluding those with phone numbers
-- Handles different email formats: UofC uses firstname.lastname@ucalgary.ca, UW uses flastname@uwaterloo.ca
CREATE OR REPLACE FUNCTION search_available_emails_by_first(
  prefix TEXT,
  university_domain TEXT,
  limit_count INT DEFAULT 5
)
RETURNS TABLE(email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.email::TEXT
  FROM auth.users u
  JOIN profiles p ON u.id = p.id
  WHERE 
    -- Filter by university domain first
    p.email LIKE '%' || university_domain
    -- Exclude profiles that already have phone numbers
    AND (p.phone_number IS NULL OR p.phone_number = '')
    -- Ensure email exists
    AND p.email IS NOT NULL
    -- University-specific email format matching
    AND (
      -- University of Calgary: firstname.lastname@ucalgary.ca
      (university_domain = '@ucalgary.ca' AND (
        -- Match by email prefix (firstname part before the dot)
        LOWER(SPLIT_PART(SPLIT_PART(p.email, '@', 1), '.', 1)) LIKE LOWER(prefix || '%')
        -- Also match by full name if available
        OR LOWER(COALESCE(u.raw_user_meta_data->>'full_name', '')) LIKE LOWER(prefix || '%')
      ))
      OR
      -- University of Waterloo: flastname@uwaterloo.ca (first letter + lastname)
      (university_domain = '@uwaterloo.ca' AND (
        -- Match by first letter of email username
        LOWER(LEFT(SPLIT_PART(p.email, '@', 1), 1)) = LOWER(LEFT(prefix, 1))
        -- Also match by full name if available
        OR LOWER(COALESCE(u.raw_user_meta_data->>'full_name', '')) LIKE LOWER(prefix || '%')
      ))
    )
  ORDER BY p.email
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user details including university and phone status
CREATE OR REPLACE FUNCTION get_user_university_status(user_email TEXT)
RETURNS TABLE(
  email TEXT,
  university TEXT,
  has_phone BOOLEAN,
  full_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.email::TEXT,
    CASE 
      WHEN p.email LIKE '%@ucalgary.ca' THEN 'uofc'
      WHEN p.email LIKE '%@uwaterloo.ca' THEN 'uw'
      ELSE 'unknown'
    END::TEXT as university,
    (p.phone_number IS NOT NULL AND p.phone_number != '')::BOOLEAN as has_phone,
    COALESCE(u.raw_user_meta_data->>'full_name', '')::TEXT as full_name
  FROM auth.users u
  JOIN profiles p ON u.id = p.id
  WHERE p.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION search_available_emails_by_first(TEXT, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_university_status(TEXT) TO authenticated;
