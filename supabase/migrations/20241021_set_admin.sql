-- Set bartek@dajer.pl as admin (run this AFTER you register the account)
UPDATE profiles
SET role = 'admin'
WHERE email = 'bartek@dajer.pl';
