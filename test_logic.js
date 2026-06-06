const users = [
  { id: '1414...', status: 'ONBOARDING', profileData: { isComplete: undefined, hasUploadedTwoPhotos: true }, uploadedPhotos: [1,2] },
  { id: '1767...', status: 'COMPLETE', profileData: { isComplete: undefined, hasUploadedTwoPhotos: true }, uploadedPhotos: [1,2] },
  { id: '94770000000', status: undefined, profileData: { isComplete: undefined, hasUploadedTwoPhotos: true }, uploadedPhotos: undefined },
  { id: '94770000005', status: undefined, profileData: { isComplete: undefined, hasUploadedTwoPhotos: false }, uploadedPhotos: undefined },
  { id: '94771010101', status: undefined, profileData: { isComplete: true, hasUploadedTwoPhotos: true }, uploadedPhotos: undefined }
];

users.forEach(user => {
  const isComplete = 
    ['COMPLETE', 'MATCHES_SENT', 'AWAITING_PARTNER_APPROVAL', 'PAYMENT_PENDING'].includes(user.status) || 
    (user.profileData?.isComplete && (user.profileData?.hasUploadedTwoPhotos || (user.uploadedPhotos && user.uploadedPhotos.length >= 2))) ||
    (user.status && user.status !== 'ONBOARDING' && user.status !== 'WAITING_FOR_ADMIN');
  console.log(`${user.id} -> isComplete: ${Boolean(isComplete)}`);
});
