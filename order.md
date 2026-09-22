[x] Packages Installed
↓
[x] .env.local
↓
[x] Folder Structure
↓
[x] MongoDB Connection
↓
[x] UI Design System
[x] Colors
[x] Typography
[x] Button
[x] Input
[x] FormField
[x] Select
[x] Card
[x] Badge
[x] Modal
[x] Alert
[x] Spinner
[x] Table
[x] Dropdown

[x] User Model
[x] Registration Validation
[x] Registration API
[x] Password Hashing
[x] Duplicate Email Check
[x] Duplicate Username Check
↓
[x] Zod Auth Validation
↓
[x] Registration API
↓
[..] Registration UI
↓
[x] Login API
↓
[..] Login UI
↓
[ ] JWT Access Token
↓
[ ] Refresh Token
↓
[ ] HttpOnly Cookie
↓
[ ] Logout
↓
[ ] Current User (/me)
↓
[..] Profile
↓
[ ] Protected Routes
↓
[ ] RBAC
↓
[ ] Permission System
↓
[ ] Admin User Management
↓
[ ] Forgot Password
↓
[ ] Reset Password
↓
[ ] Email Verification
↓
[ ] Login Security
↓
[ ] Audit Logs
↓
[ ] 2FA
↓
[ ] Testing
↓
[ ] Production Security

## Authentication

[x] Registration
[x] Login
[x] Logout
[x] JWT Access Token
[x] Refresh Token
[x] HttpOnly Cookie
[x] Password Hashing
[x] Forgot Password
[x] Reset Password
[ ] Email Verification
[x] Current User
[ ] Profile functionality
[x] Protected API
[x] RBAC
[x] Permission System
[ ] Admin User Management
[ ] Login Security
[ ] Session/Device Management
[ ] Audit Logs
[ ] 2FA

## Authorization

[x] Role Model
[x] Permission Model
[x] Permission Seed
[x] Role Seed
[x] requireAuth()
[x] requireRole()
[x] requirePermission()
[ ] Permission-based API test
[ ] User ↔ Role integration verification

## Database

[x] User Model
[x] Session / Refresh Token Model
[x] Role Model
[x] Permission Model
[ ] Audit Log Model

## Finalization

[ ] Complete Auth UI integration
[ ] Testing
[ ] Security hardening
[ ] Production security checklist

1. Auth UI Integration
   ├── Login
   ├── Register
   ├── Forgot Password
   └── Reset Password

2. Protected Frontend
   ├── Auth state
   ├── Current user
   ├── Logout
   └── Route protection

3. Dashboard Layout
   ├── Sidebar
   ├── Header
   ├── User menu
   └── Responsive layout

4. Profile
   ├── Profile information
   ├── Change password
   └── Active sessions/devices

5. Admin UI
   ├── Users
   ├── Roles
   └── Permissions

6. এরপর মূল Diagnostics modules
   ├── Patients
   ├── Doctors/Referrals
   ├── Tests
   ├── Test Categories
   ├── Lab Samples
   ├── Billing
   ├── Reports
   └── Settings

    1. Patients
       ↓

7. Doctors / Referrals
   ↓
8. Test Categories
   ↓
9. Tests
   ↓
10. Lab Samples
    ↓
11. Billing
    ↓
12. Reports
    ↓
13. Settings

achha eta mathay rekhe project ta banan

Diagnostic Center-e General Tests (Ki ki hoy)

Pathology Tests (Blood & Urine):

CBC (Complete Blood Count): Raktte blood cell-er poriman ba hemoglobin jachai korte.

Diabetes Test: Fasting Blood Sugar (FBS), PPBS, HbA1c.

Lipid Profile: Cholesterol ebong fat-er poriman.

Liver Function Test (LFT) & Kidney Function Test (KFT): Liver ebong kidney-r kormokhomota dekhar jonyo.

Thyroid Profile: T3, T4, TSH.

Urine & Stool Routine Examination.

Imaging & Radiology:

X-Ray

USG (Ultrasonography): Whole Abdomen, Pelvis, KUB, Pregnancy scan, etc.

CT Scan ebong MRI Scan (boro diagnostic center-gulate thake).

Cardiology & Others:

ECG: Heart-er electrical activity dekhar jonyo.

Echocardiography (Echo) ebong TMT.

2. X-Ray Areas (Kothay Kothay X-Ray kora jay)

Body-r almost sob jaigari X-Ray kora sombhob, jetake main division-gulate vag kora hoy:

Chest (Buk):

Chest X-Ray (PA view) – Lungs (fuphufoos), heart ebong buker bone dekhar jonyo khub common.

Spine (Merudando):

Cervical Spine: Golar dike merudando.

Thoracic Spine: Pit-er dike merudando.

Lumbar Spine: Komor-er dike merudando (komor byatha hole beshi kora hoy).

Bones & Joints (Hath ebong Pa-r haad):

Upper Limbs: Shoulder (kandh), Elbow (konui), Wrist (konji), Hand/Fingers (hath-er angul).

Lower Limbs: Hip joint (khora/koyel), Knee (hutu), Ankle (goali), Foot/Toes (pa-r angul).

Skull ebong Face (Matha ebong Mukh):

Skull X-Ray (mathar haad), PNS (Paranasal Sinuses -nak ebong mathar cavity), Jaw (jaw-er haad).

Abdomen (Pet):

KUB (Kidney, Ureter, Bladder) ebong Plain Abdominal X-Ray (pet-e gas ba pathor/obstruction bujhte).

Dental X-Ray:

OPG (Orthopantomogram): Samagro datar ebong jaw-er ekti single X-Ray.

1. Advanced Imaging & Scans (Jekhane aro boro machine lage)

MRI (Magnetic Resonance Imaging): Matha (Brain), Merudando (Spine), Ligament/Knee injury (Joints) ebong soft tissue-r khutinati dekhar jonyo.

CT Scan (Computed Tomography): Brain, Chest, Whole Abdomen ba Kono accident ba injury-r por internal bleeding ba bone fracture bujhte.

Mammography: Mohilader breast-er kono gnaat ba somossa ba cancer screening-er jonyo nirdishto X-Ray.

Bone Mineral Densitometry (BMD) / DEXA Scan: Har-er khoy ba osteoporosis (har durbol hoye jawa) mapar jonyo.

2. Heart & Blood Vessel Tests (Cardiology & Vascular)

Color Doppler / Vascular Doppler: Rater roktosoncalon (Blood circulation) ebong block ba clot ache kina ta dekhar jonyo (Jemon- Carotid Doppler, Lower limb Doppler).

Holter Monitoring: 24 ghonta ba tar besi somoy dhore heart-er rhythm record korar jonyo portable machine.

Echocardiography (Echo): Heart-er valve ebong pumping capacity dekhar jonyo USG-er moto test.

3. Neurological Tests (Matha ebong Snabi-r test)

EEG (Electroencephalography): Mathar electrical activity ba epilepsy (mirgi ba baal rog) check korar jonyo.

EMG & NCV (Nerve Conduction Velocity): Hat-pa-r snayu (nerve) ebong muscle-r somossa ba weakness ba numbness bujhte.

4. Endoscopy & Special Procedures

Endoscopy / Upper GIoscopy: Mukh diye ekta choto camera-jukt noli pathiye gola, pakosthali (stomach), ebong small intestine-er uporer bhag dekha.

Colonoscopy: Paykhanar rasta diye camera pathiye boro intestine (colon) check kora.

USG-guided FNAC / Biopsy: Sonography-r sahajje sorir-er kono jaiga (jemon gnaat ba tumor) theke syringe diye sample niye lab test korano.

Diagnostic Center
│
├── Patients
│
├── Doctors / Referrals
│
├── Test Categories
│ ├── Pathology
│ ├── Radiology & Imaging
│ ├── Cardiology & Vascular
│ ├── Neurology
│ └── Endoscopy & Special Procedures
│
├── Tests
│ ├── CBC
│ ├── FBS
│ ├── PPBS
│ ├── HbA1c
│ ├── Lipid Profile
│ ├── LFT
│ ├── KFT
│ ├── Thyroid Profile
│ ├── Urine / Stool
│ │
│ ├── X-Ray
│ │ ├── Chest
│ │ ├── Spine
│ │ ├── Upper Limb
│ │ ├── Lower Limb
│ │ ├── Skull / Face
│ │ ├── Abdomen / KUB
│ │ └── Dental / OPG
│ │
│ ├── USG
│ ├── CT Scan
│ ├── MRI
│ ├── Mammography
│ ├── BMD / DEXA
│ │
│ ├── ECG
│ ├── Echo
│ ├── TMT
│ ├── Doppler
│ ├── Holter
│ │
│ ├── EEG
│ ├── EMG
│ ├── NCV
│ │
│ ├── Endoscopy
│ ├── Colonoscopy
│ └── FNAC / Biopsy
│
├── Lab Samples
│
├── Billing
│
├── Reports
│
└── Settings
