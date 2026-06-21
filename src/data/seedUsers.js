/**
 * Seed user data for Oak Ridge Composite Squadron TN-170 contact directory.
 * NO rank fields — display names are first/middle/last only.
 */

const RAW_USERS = [
  '362254 Lemont T Adrian',
  '706279 Janelle C Allison',
  '249023 Ernest E Burchell',
  '744144 Rebecca J Chretien',
  '744143 Everett J Chretien',
  '766637 Guy R Cooper',
  '764706 Andrew Diaz',
  '735120 Margaret A Durgin',
  '766638 Amanda L Harvey',
  '411177 Zachary D Johnson Jr',
  '450227 Clarence M Juneau',
  '729204 Tristan G Maratos',
  '326320 Steven C Mellard',
  '736465 Desiree Morse',
  '757794 Tonya M Osborne',
  '702226 Mel W Osborne',
  '621484 Sandra L Puska',
  '577946 Annabelle Thomas',
  '740617 Tyler M Thomas',
  '270831 Timothy S Waddell',
  '657945 Anthony A Warthan',
  '662670 Colleen J Warthan',
  '738555 Jesse W Wilkie',
];

function parseUserLine(line) {
  const parts = line.trim().split(/\s+/);
  const capid = parts[0];
  const suffix = parts[parts.length - 1] === 'Jr' ? 'Jr' : '';
  const nameParts = suffix ? parts.slice(1, -1) : parts.slice(1);
  const lastName = nameParts[nameParts.length - 1];
  const middleInitial = nameParts.length > 2 ? nameParts[nameParts.length - 2] : '';
  const firstName = nameParts.slice(0, nameParts.length - (middleInitial ? 2 : 1)).join(' ');

  const displayName = suffix
    ? `${firstName} ${middleInitial} ${lastName} ${suffix}`
    : middleInitial
      ? `${firstName} ${middleInitial} ${lastName}`
      : `${firstName} ${lastName}`;

  return {
    capid,
    firstName,
    middleInitial,
    lastName,
    suffix,
    displayName,
    internalAuthEmail: `${capid}@tn170.local`,
    isActive: true,
    mustChangePassword: true,
  };
}

export const seedUsers = RAW_USERS.map(parseUserLine);

export default seedUsers;
