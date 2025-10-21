-- Make the most recent user admin
UPDATE profiles
SET role = 'admin'
WHERE id = '6f18fe7a-cbc5-4b1f-8cc3-c76f955d29a6';

-- Also ensure bartek is admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'bartek@dajer.pl';
