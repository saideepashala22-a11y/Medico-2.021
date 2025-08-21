import { db } from '../server/db';
import { labTestDefinitions } from '../shared/schema';

const labTests = [
  { testName: "24 Hrs URINARY PROTEINS", department: "Pathology", cost: 700.00 },
  { testName: "ABSOLUTE EOSINOPHIL COUNT(AEC)", department: "Hematology", cost: 600.00 },
  { testName: "AFB (Acid Fast Bacilli) CULTURE", department: "Microbiology", cost: 800.00 },
  { testName: "ALBUMIN", department: "Biochemistry", cost: 200.00 },
  { testName: "ANTENATAL PROFILE(ANC PROFILE)", department: "Pathology", cost: 1500.00 },
  { testName: "APTT", department: "Hematology", cost: 600.00 },
  { testName: "ASO TITRE", department: "Biochemistry", cost: 300.00 },
  { testName: "ASO/R.A/C.R.P", department: "Biochemistry", cost: 900.00 },
  { testName: "SERUM AMYLASE", department: "Biochemistry", cost: 400.00 },
  { testName: "BICARBONATE", department: "Biochemistry", cost: 500.00 },
  { testName: "BILE SALT & BILE PIGMENTS", department: "Pathology", cost: 50.00 },
  { testName: "SERUM BILIRUBIN", department: "Biochemistry", cost: 200.00 },
  { testName: "BT CT (Bleeding Time, Clotting Time)", department: "Hematology", cost: 100.00 },
  { testName: "BLOOD GROUP", department: "Hematology", cost: 100.00 },
  { testName: "BLOOD UREA", department: "Biochemistry", cost: 200.00 },
  { testName: "BLOOD UREA NITROGEN (BUN)", department: "Biochemistry", cost: 200.00 },
  { testName: "SERUM CALCIUM", department: "Biochemistry", cost: 200.00 },
  { testName: "CBP (Complete Blood Picture)", department: "Hematology", cost: 300.00 },
  { testName: "CK-MB", department: "Biochemistry", cost: 300.00 },
  { testName: "CK-NAC", department: "Biochemistry", cost: 300.00 },
  { testName: "ARTHRITIS PROFILE", department: "Biochemistry", cost: 2500.00 },
  { testName: "CRP (C-Reactive Protein)", department: "Biochemistry", cost: 300.00 },
  { testName: "URINE CULTURE & SENSIVITY", department: "Microbiology", cost: 750.00 },
  { testName: "DENGUE IgG, IgM & NS1", department: "Microbiology", cost: 1500.00 },
  { testName: "ESR (Erythrocyte Sedimentation Rate)", department: "Hematology", cost: 100.00 },
  { testName: "ESTROGEN", department: "Biochemistry", cost: 600.00 },
  { testName: "FBS & PLBS", department: "Biochemistry", cost: 100.00 },
  { testName: "FBS (Fasting Blood Sugar)", department: "Biochemistry", cost: 50.00 },
  { testName: "FERRITIN", department: "Biochemistry", cost: 1000.00 },
  { testName: "FSH (Follicle Stimulating Hormone)", department: "Biochemistry", cost: 500.00 },
  { testName: "FT3 FT4 (Free T3, Free T4)", department: "Biochemistry", cost: 600.00 },
  { testName: "HbA1c", department: "Biochemistry", cost: 500.00 },
  { testName: "GLUCOSE TOLERANCE TEST(GTT)", department: "Biochemistry", cost: 400.00 },
  { testName: "GLYCOSYLATED HEMOGLOBIN(GHbA1c)", department: "Biochemistry", cost: 500.00 },
  { testName: "GRAM STAIN", department: "Microbiology", cost: 250.00 },
  { testName: "HAEMOGLOBIN", department: "Hematology", cost: 100.00 },
  { testName: "HAEMOGRAM", department: "Hematology", cost: 250.00 },
  { testName: "ECG (Electrocardiogram)", department: "Cardiology", cost: 400.00 },
  { testName: "CUE (Complete Urine Examination)", department: "Pathology", cost: 100.00 },
  { testName: "HBsAg (Hepatitis B Surface Antigen)", department: "Microbiology", cost: 200.00 },
  { testName: "HCV (Hepatitis C Virus)", department: "Microbiology", cost: 600.00 },
  { testName: "HIV", department: "Microbiology", cost: 300.00 },
  { testName: "SERUM IRON", department: "Biochemistry", cost: 650.00 },
  { testName: "LH (Luteinizing Hormone)", department: "Biochemistry", cost: 300.00 },
  { testName: "LIPID PROFILE TEST", department: "Biochemistry", cost: 500.00 },
  { testName: "LIVER FUNCTION TEST(LFT)", department: "Biochemistry", cost: 500.00 },
  { testName: "MALARIAL PARASITE (PV & PF)", department: "Microbiology", cost: 300.00 },
  { testName: "MALARIAL PARASITE (SMEAR FOR MP)", department: "Microbiology", cost: 100.00 },
  { testName: "MANTOUX TEST", department: "Microbiology", cost: 200.00 },
  { testName: "MYOGLOBIN", department: "Biochemistry", cost: 850.00 },
  { testName: "PCV (Packed Cell Volume)", department: "Hematology", cost: 100.00 },
  { testName: "SERUM PHOSPHORUS", department: "Biochemistry", cost: 200.00 },
  { testName: "PLATELET COUNT", department: "Hematology", cost: 200.00 },
  { testName: "POST LUNCH BLOOD SUGAR", department: "Biochemistry", cost: 70.00 },
  { testName: "SERUM POTASSIUM", department: "Biochemistry", cost: 200.00 },
  { testName: "URINE FOR PREGNANCY TEST", department: "Pathology", cost: 100.00 },
  { testName: "PROGESTERONE", department: "Biochemistry", cost: 800.00 },
  { testName: "PROLACTIN", department: "Biochemistry", cost: 500.00 },
  { testName: "PT (Prothrombin Time)", department: "Hematology", cost: 500.00 },
  { testName: "RA FACTOR (Rheumatoid Arthritis Factor)", department: "Biochemistry", cost: 300.00 },
  { testName: "RBS (Random Blood Sugar)", department: "Biochemistry", cost: 50.00 },
  { testName: "REC (Reticulocyte Count)", department: "Hematology", cost: 150.00 },
  { testName: "GAMMA G.T.", department: "Biochemistry", cost: 250.00 },
  { testName: "S.G.O.T. (SGOT/AST)", department: "Biochemistry", cost: 200.00 },
  { testName: "S.G.P.T. (SGPT/ALT)", department: "Biochemistry", cost: 200.00 },
  { testName: "SEMEN ANALYSIS", department: "Pathology", cost: 200.00 },
  { testName: "SERUM CREATININE", department: "Biochemistry", cost: 200.00 },
  { testName: "SERUM PROTEINS", department: "Biochemistry", cost: 200.00 },
  { testName: "SMEAR FOR FUNGAL ELEMENTS", department: "Microbiology", cost: 500.00 },
  { testName: "SERUM SODIUM", department: "Biochemistry", cost: 200.00 },
  { testName: "SPUTUM FOR A.F.B", department: "Microbiology", cost: 400.00 },
  { testName: "SPUTUM FOR MALIGNANT CELLS", department: "Pathology", cost: 500.00 },
  { testName: "STONE ANALYSIS", department: "Pathology", cost: 1000.00 },
  { testName: "STOOL EXAMINATION", department: "Pathology", cost: 200.00 },
  { testName: "STOOL FOR OCCULT BLOOD", department: "Pathology", cost: 150.00 },
  { testName: "T3 (Triiodothyronine)", department: "Biochemistry", cost: 250.00 },
  { testName: "T4 (Thyroxine)", department: "Biochemistry", cost: 250.00 },
  { testName: "TESTOSTERONE", department: "Biochemistry", cost: 750.00 },
  { testName: "THYROID PROFILE (T3 T4 & TSH)", department: "Biochemistry", cost: 500.00 },
  { testName: "TOTAL CHOLESTEROL", department: "Biochemistry", cost: 200.00 },
  { testName: "TOTAL PROTEINS", department: "Biochemistry", cost: 200.00 },
  { testName: "SERUM TRIGLYCERIDES", department: "Biochemistry", cost: 200.00 },
  { testName: "ULTRA SOUND WHOLE ABDOMEN", department: "Radiology", cost: 600.00 },
  { testName: "TSH (Thyroid Stimulating Hormone)", department: "Biochemistry", cost: 300.00 },
  { testName: "SERUM URIC ACID", department: "Biochemistry", cost: 200.00 },
  { testName: "URINARY PROTEIN 24 HRS", department: "Pathology", cost: 50.00 },
  { testName: "URINE FOR MICROALBUMIN", department: "Pathology", cost: 450.00 },
  { testName: "VDRL", department: "Microbiology", cost: 200.00 },
  { testName: "VITAMIN D3", department: "Biochemistry", cost: 650.00 },
  { testName: "WIDAL TEST WITH MP", department: "Microbiology", cost: 400.00 },
  // X-Ray Tests
  { testName: "X-RAY CHEST PA", department: "Radiology", cost: 500.00 },
  { testName: "X-RAY CHEST PA VIEW", department: "Radiology", cost: 500.00 },
  { testName: "X-RAY CHEST AP VIEW", department: "Radiology", cost: 500.00 },
  { testName: "X-RAY PELVIS", department: "Radiology", cost: 200.00 },
  { testName: "X-RAY PNS", department: "Radiology", cost: 200.00 },
  { testName: "X-RAY ABDOMEN ERRECT", department: "Radiology", cost: 500.00 },
  { testName: "X-RAY LUMBAR SPINE AP & LATERAL VIEW", department: "Radiology", cost: 400.00 },
  { testName: "X-RAY KUB", department: "Radiology", cost: 500.00 },
  { testName: "X-RAY IVP", department: "Radiology", cost: 2300.00 }
];

async function populateLabTests() {
  try {
    console.log('Starting to populate lab test definitions...');
    
    // Create a default user ID for the createdBy field
    const defaultUserId = '1de7fabc-ac31-4e8a-b08d-dba6d27e9d4b';
    
    for (const test of labTests) {
      const testWithMetadata = {
        ...test,
        createdBy: defaultUserId,
        isActive: true
      };
      
      await db.insert(labTestDefinitions).values([testWithMetadata]);
      console.log(`Added: ${test.testName}`);
    }
    
    console.log(`\nSuccessfully populated ${labTests.length} lab test definitions!`);
  } catch (error) {
    console.error('Error populating lab tests:', error);
  }
}

populateLabTests();