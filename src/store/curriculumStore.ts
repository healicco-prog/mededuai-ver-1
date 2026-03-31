import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Topic = { id: string, name: string, generatedNotes?: Record<string, string> };
export type Section = { id: string, name: string, topics: Topic[] };
export type Subject = { id: string, name: string, sections: Section[] };

export type LMSNotesStructureItem = {
    id: string;
    title: string;
    description: string;
    value: string;
    type: 'text' | 'number';
    wordCount?: string; // Total words needed (for text format sections)
};

export const defaultLMSStructure: LMSNotesStructureItem[] = [
    { id: 'l1', title: 'Introduction', description: 'Mention how it has to be', value: 'Exam-oriented bullet points', type: 'text' },
    { id: 'l2', title: 'Detailed Notes', description: 'Mention how it has to be / approx words', value: 'Essay format', type: 'text' },
    { id: 'l3', title: 'Summary', description: 'Mention how it has to be', value: 'Concise revision or image summary', type: 'text' },
    { id: 'l4', title: '10 Marks Question', description: 'Select No', value: '0', type: 'number' },
    { id: 'l5', title: '5 Marks Question', description: 'Select No', value: '0', type: 'number' },
    { id: 'l6', title: '3 Marks Reasoning Question', description: 'Select No', value: '0', type: 'number' },
    { id: 'l7', title: '2 Marks Case-based MCQs', description: 'Select No', value: '0', type: 'number' },
    { id: 'l8', title: '1 Mark MCQs Question', description: 'Select No', value: '0', type: 'number' },
    { id: 'l9', title: 'Flashcards', description: 'Number of flashcards', value: '0', type: 'number' },
    { id: 'l10', title: 'PPT', description: 'Number of slides required.', value: '0', type: 'number' }
];

// ========== MBBS Full Curriculum ==========
const mbbsSubjects: Subject[] = [
    {
        id: 'mbbs-s1', name: 'Anatomy',
        sections: [
            { id: 'mbbs-s1-sec1', name: 'General Anatomy: Basic Concepts', topics: [
                { id: 'mbbs-anat-1', name: 'Anatomical positions & planes' },
                { id: 'mbbs-anat-2', name: 'Terms of movements' },
                { id: 'mbbs-anat-3', name: 'Types of bones' },
                { id: 'mbbs-anat-4', name: 'Blood supply of bones' },
                { id: 'mbbs-anat-5', name: 'Types of joints & movements' },
            ]},
            { id: 'mbbs-s1-sec2', name: 'General Anatomy: Histology Basics', topics: [
                { id: 'mbbs-anat-6', name: 'Epithelium types & modifications' },
                { id: 'mbbs-anat-7', name: 'Connective tissue' },
                { id: 'mbbs-anat-8', name: 'Cartilage types' },
                { id: 'mbbs-anat-9', name: 'Muscle types' },
                { id: 'mbbs-anat-10', name: 'Nerve structure' },
            ]},
            { id: 'mbbs-s1-sec3', name: 'General Anatomy: Embryology Basics', topics: [
                { id: 'mbbs-anat-11', name: 'Gametogenesis' },
                { id: 'mbbs-anat-12', name: 'Fertilization' },
                { id: 'mbbs-anat-13', name: 'Implantation' },
                { id: 'mbbs-anat-14', name: 'Placenta' },
                { id: 'mbbs-anat-15', name: 'Germ layers & derivatives' },
                { id: 'mbbs-anat-16', name: 'Congenital anomalies basics' },
            ]},
            { id: 'mbbs-s1-sec4', name: 'Upper Limb: Osteology', topics: [
                { id: 'mbbs-anat-17', name: 'Clavicle very important' },
                { id: 'mbbs-anat-18', name: 'Scapula' },
                { id: 'mbbs-anat-19', name: 'Humerus' },
                { id: 'mbbs-anat-20', name: 'Radius & Ulna' },
            ]},
            { id: 'mbbs-s1-sec5', name: 'Upper Limb: Joints', topics: [
                { id: 'mbbs-anat-21', name: 'Shoulder joint' },
                { id: 'mbbs-anat-22', name: 'Elbow joint' },
                { id: 'mbbs-anat-23', name: 'Wrist joint' },
            ]},
            { id: 'mbbs-s1-sec6', name: 'Upper Limb: Important Topics', topics: [
                { id: 'mbbs-anat-24', name: 'Brachial plexus very high yield' },
                { id: 'mbbs-anat-25', name: 'Axilla' },
                { id: 'mbbs-anat-26', name: 'Cubital fossa' },
                { id: 'mbbs-anat-27', name: 'Carpal tunnel syndrome' },
                { id: 'mbbs-anat-28', name: 'Anatomical snuff box' },
                { id: 'mbbs-anat-29', name: 'Erb’s palsy & Klumpke’s palsy' },
            ]},
            { id: 'mbbs-s1-sec7', name: 'Lower Limb: Osteology', topics: [
                { id: 'mbbs-anat-30', name: 'Hip bone' },
                { id: 'mbbs-anat-31', name: 'Femur' },
                { id: 'mbbs-anat-32', name: 'Tibia' },
            ]},
            { id: 'mbbs-s1-sec8', name: 'Lower Limb: Joints', topics: [
                { id: 'mbbs-anat-33', name: 'Hip joint very important' },
                { id: 'mbbs-anat-34', name: 'Knee joint' },
                { id: 'mbbs-anat-35', name: 'Ankle joint' },
            ]},
            { id: 'mbbs-s1-sec9', name: 'Lower Limb: Important Areas', topics: [
                { id: 'mbbs-anat-36', name: 'Femoral triangle' },
                { id: 'mbbs-anat-37', name: 'Adductor canal' },
                { id: 'mbbs-anat-38', name: 'Popliteal fossa' },
                { id: 'mbbs-anat-39', name: 'Gluteal region' },
                { id: 'mbbs-anat-40', name: 'Foot arches' },
                { id: 'mbbs-anat-41', name: 'Trendelenburg sign' },
            ]},
            { id: 'mbbs-s1-sec10', name: 'Thorax', topics: [
                { id: 'mbbs-anat-42', name: 'Thoracic inlet & outlet' },
                { id: 'mbbs-anat-43', name: 'Intercostal spaces' },
                { id: 'mbbs-anat-44', name: 'Diaphragm' },
                { id: 'mbbs-anat-45', name: 'Mediastinum very important' },
                { id: 'mbbs-anat-46', name: 'Heart – chambers valves blood supply' },
                { id: 'mbbs-anat-47', name: 'Coronary circulation' },
                { id: 'mbbs-anat-48', name: 'Conducting system of heart' },
                { id: 'mbbs-anat-49', name: 'Lung surfaces & bronchopulmonary segments' },
            ]},
            { id: 'mbbs-s1-sec11', name: 'Abdomen', topics: [
                { id: 'mbbs-anat-50', name: 'Anterior abdominal wall' },
                { id: 'mbbs-anat-51', name: 'Inguinal canal very important' },
                { id: 'mbbs-anat-52', name: 'Peritoneum & peritoneal folds' },
                { id: 'mbbs-anat-53', name: 'Stomach' },
                { id: 'mbbs-anat-54', name: 'Liver blood supply' },
                { id: 'mbbs-anat-55', name: 'Portal vein & portocaval anastomosis' },
                { id: 'mbbs-anat-56', name: 'Pancreas' },
                { id: 'mbbs-anat-57', name: 'Spleen' },
                { id: 'mbbs-anat-58', name: 'Kidney & suprarenal gland' },
            ]},
            { id: 'mbbs-s1-sec12', name: 'Head & Neck: Neck', topics: [
                { id: 'mbbs-anat-59', name: 'Triangles of neck' },
                { id: 'mbbs-anat-60', name: 'Thyroid gland' },
                { id: 'mbbs-anat-61', name: 'Carotid sheath' },
                { id: 'mbbs-anat-62', name: 'Cranial nerves in neck' },
            ]},
            { id: 'mbbs-s1-sec13', name: 'Head & Neck: Face & Scalp', topics: [
                { id: 'mbbs-anat-63', name: 'Facial nerve very important' },
                { id: 'mbbs-anat-64', name: 'Dangerous area of face' },
                { id: 'mbbs-anat-65', name: 'Cavernous sinus' },
            ]},
            { id: 'mbbs-s1-sec14', name: 'Head & Neck: Cranial Nerves', topics: [
                { id: 'mbbs-anat-66', name: 'Olfactory' },
                { id: 'mbbs-anat-67', name: 'Optic' },
                { id: 'mbbs-anat-68', name: 'Oculomotor' },
                { id: 'mbbs-anat-69', name: 'Trochlear' },
                { id: 'mbbs-anat-70', name: 'Trigeminal' },
                { id: 'mbbs-anat-71', name: 'Abducens' },
                { id: 'mbbs-anat-72', name: 'Facial' },
                { id: 'mbbs-anat-73', name: 'Vestibulocochlear' },
                { id: 'mbbs-anat-74', name: 'Glossopharyngeal' },
                { id: 'mbbs-anat-75', name: 'Vagus' },
                { id: 'mbbs-anat-76', name: 'Accessory' },
                { id: 'mbbs-anat-77', name: 'Hypoglossal' },
            ]},
            { id: 'mbbs-s1-sec15', name: 'Head & Neck: Orbit', topics: [
                { id: 'mbbs-anat-78', name: 'Extraocular muscles' },
                { id: 'mbbs-anat-79', name: 'Ciliary ganglion' },
            ]},
            { id: 'mbbs-s1-sec16', name: 'Neuroanatomy', topics: [
                { id: 'mbbs-anat-80', name: 'Spinal cord tracts very important' },
                { id: 'mbbs-anat-81', name: 'Internal capsule' },
                { id: 'mbbs-anat-82', name: 'Brainstem' },
                { id: 'mbbs-anat-83', name: 'Cerebellum' },
                { id: 'mbbs-anat-84', name: 'Thalamus' },
                { id: 'mbbs-anat-85', name: 'Basal ganglia' },
                { id: 'mbbs-anat-86', name: 'Ventricular system' },
                { id: 'mbbs-anat-87', name: 'Circle of Willis' },
                { id: 'mbbs-anat-88', name: 'Blood supply of brain' },
                { id: 'mbbs-anat-89', name: 'Meninges' },
                { id: 'mbbs-anat-90', name: 'CSF circulation' },
            ]},
            { id: 'mbbs-s1-sec17', name: 'Histology Spotters', topics: [
                { id: 'mbbs-anat-91', name: 'All epithelial types' },
                { id: 'mbbs-anat-92', name: 'Lymph node' },
                { id: 'mbbs-anat-93', name: 'Spleen' },
                { id: 'mbbs-anat-94', name: 'Thymus' },
                { id: 'mbbs-anat-95', name: 'Thyroid' },
                { id: 'mbbs-anat-96', name: 'Liver' },
                { id: 'mbbs-anat-97', name: 'Kidney' },
                { id: 'mbbs-anat-98', name: 'Testis' },
                { id: 'mbbs-anat-99', name: 'Ovary' },
            ]},
            { id: 'mbbs-s1-sec18', name: 'Embryology', topics: [
                { id: 'mbbs-anat-100', name: 'Pharyngeal arches' },
                { id: 'mbbs-anat-101', name: 'Development of heart' },
                { id: 'mbbs-anat-102', name: 'Development of face & palate' },
                { id: 'mbbs-anat-103', name: 'Neural tube defects' },
                { id: 'mbbs-anat-104', name: 'Development of kidney' },
                { id: 'mbbs-anat-105', name: 'Development of diaphragm' },
            ]},
        ]
    },
    {
        id: 'mbbs-s2', name: 'Physiology',
        sections: [
            { id: 'mbbs-s2-sec1', name: 'General Physiology (Cell Physiology)', topics: [
                { id: 'mbbs-physio-1', name: 'Structure & function of cell' },
                { id: 'mbbs-physio-2', name: 'Cell membrane – fluid mosaic model' },
                { id: 'mbbs-physio-3', name: 'Transport mechanisms (diffusion, osmosis, active transport)' },
                { id: 'mbbs-physio-4', name: 'Resting membrane potential' },
                { id: 'mbbs-physio-5', name: 'Action potential (phases & ionic basis)' },
                { id: 'mbbs-physio-6', name: 'Body fluid compartments & composition' },
                { id: 'mbbs-physio-7', name: 'Acid-base balance (Henderson–Hasselbalch equation)' },
                { id: 'mbbs-physio-8', name: 'Buffer systems' },
            ]},
            { id: 'mbbs-s2-sec2', name: 'Hematology', topics: [
                { id: 'mbbs-physio-9', name: 'Erythropoiesis (stages & regulation)' },
                { id: 'mbbs-physio-10', name: 'Hemoglobin – structure & functions' },
                { id: 'mbbs-physio-11', name: 'Oxygen dissociation curve (shifts & significance)' },
                { id: 'mbbs-physio-12', name: 'Anemia classification' },
                { id: 'mbbs-physio-13', name: 'WBC types & functions' },
                { id: 'mbbs-physio-14', name: 'Immunity (innate & adaptive)' },
                { id: 'mbbs-physio-15', name: 'Blood groups (ABO & Rh)' },
                { id: 'mbbs-physio-16', name: 'Hemostasis & coagulation cascade' },
                { id: 'mbbs-physio-17', name: 'Anticoagulants' },
            ]},
            { id: 'mbbs-s2-sec3', name: 'Cardiovascular System (CVS)', topics: [
                { id: 'mbbs-physio-18', name: 'Cardiac cycle (with diagram)' },
                { id: 'mbbs-physio-19', name: 'Heart sounds & murmurs' },
                { id: 'mbbs-physio-20', name: 'ECG (waves & intervals)' },
                { id: 'mbbs-physio-21', name: 'Cardiac output (factors affecting)' },
                { id: 'mbbs-physio-22', name: 'Regulation of blood pressure' },
                { id: 'mbbs-physio-23', name: 'Baroreceptor reflex' },
                { id: 'mbbs-physio-24', name: 'Microcirculation' },
                { id: 'mbbs-physio-25', name: 'Shock – types & stages' },
            ]},
            { id: 'mbbs-s2-sec4', name: 'Respiratory System', topics: [
                { id: 'mbbs-physio-26', name: 'Mechanics of respiration' },
                { id: 'mbbs-physio-27', name: 'Lung volumes & capacities' },
                { id: 'mbbs-physio-28', name: 'Oxygen transport' },
                { id: 'mbbs-physio-29', name: 'CO₂ transport' },
                { id: 'mbbs-physio-30', name: 'Regulation of respiration' },
                { id: 'mbbs-physio-31', name: 'Hypoxia – types' },
                { id: 'mbbs-physio-32', name: 'Cyanosis' },
            ]},
            { id: 'mbbs-s2-sec5', name: 'Gastrointestinal System (GIT)', topics: [
                { id: 'mbbs-physio-33', name: 'Saliva – composition & functions' },
                { id: 'mbbs-physio-34', name: 'Gastric secretion & regulation' },
                { id: 'mbbs-physio-35', name: 'HCl secretion mechanism' },
                { id: 'mbbs-physio-36', name: 'Pancreatic secretion' },
                { id: 'mbbs-physio-37', name: 'Bile salts & functions' },
                { id: 'mbbs-physio-38', name: 'Movements of GIT' },
                { id: 'mbbs-physio-39', name: 'Digestion & absorption (especially fats)' },
                { id: 'mbbs-physio-40', name: 'Enterohepatic circulation' },
            ]},
            { id: 'mbbs-s2-sec6', name: 'Nervous System', topics: [
                { id: 'mbbs-physio-41', name: 'Synapse (types & transmission)' },
                { id: 'mbbs-physio-42', name: 'Neurotransmitters' },
                { id: 'mbbs-physio-43', name: 'Reflex arc' },
                { id: 'mbbs-physio-44', name: 'Sensory pathways (DCML, Spinothalamic)' },
                { id: 'mbbs-physio-45', name: 'Motor pathways (Pyramidal tract)' },
                { id: 'mbbs-physio-46', name: 'Cerebellum functions' },
                { id: 'mbbs-physio-47', name: 'Basal ganglia' },
                { id: 'mbbs-physio-48', name: 'Hypothalamus functions' },
                { id: 'mbbs-physio-49', name: 'Sleep & EEG' },
                { id: 'mbbs-physio-50', name: 'CSF formation & circulation' },
            ]},
            { id: 'mbbs-s2-sec7', name: 'Special Senses', topics: [
                { id: 'mbbs-physio-51', name: 'Visual pathway' },
                { id: 'mbbs-physio-52', name: 'Refractive errors' },
                { id: 'mbbs-physio-53', name: 'Auditory pathway' },
                { id: 'mbbs-physio-54', name: 'Taste pathway' },
                { id: 'mbbs-physio-55', name: 'Olfactory pathway' },
            ]},
            { id: 'mbbs-s2-sec8', name: 'Endocrinology', topics: [
                { id: 'mbbs-physio-56', name: 'Mechanism of hormone action' },
                { id: 'mbbs-physio-57', name: 'Thyroid hormones (functions & regulation)' },
                { id: 'mbbs-physio-58', name: 'Insulin & Diabetes mellitus' },
                { id: 'mbbs-physio-59', name: 'Adrenal cortex hormones' },
                { id: 'mbbs-physio-60', name: 'Calcium metabolism (PTH, Vitamin D)' },
                { id: 'mbbs-physio-61', name: 'Menstrual cycle (hormonal changes)' },
                { id: 'mbbs-physio-62', name: 'Contraception basics' },
            ]},
            { id: 'mbbs-s2-sec9', name: 'Renal Physiology', topics: [
                { id: 'mbbs-physio-63', name: 'GFR & its regulation' },
                { id: 'mbbs-physio-64', name: 'Tubular reabsorption & secretion' },
                { id: 'mbbs-physio-65', name: 'Countercurrent mechanism' },
                { id: 'mbbs-physio-66', name: 'Concentration & dilution of urine' },
                { id: 'mbbs-physio-67', name: 'RAAS system' },
                { id: 'mbbs-physio-68', name: 'Micturition reflex' },
                { id: 'mbbs-physio-69', name: 'Acid-base regulation by kidney' },
            ]},
            { id: 'mbbs-s2-sec10', name: 'Reproductive Physiology', topics: [
                { id: 'mbbs-physio-70', name: 'Spermatogenesis' },
                { id: 'mbbs-physio-71', name: 'Oogenesis' },
                { id: 'mbbs-physio-72', name: 'Menstrual cycle' },
                { id: 'mbbs-physio-73', name: 'Hormonal regulation' },
                { id: 'mbbs-physio-74', name: 'Pregnancy hormones' },
                { id: 'mbbs-physio-75', name: 'Lactation' },
            ]},
            { id: 'mbbs-s2-sec11', name: 'High Yield Topics', topics: [
                { id: 'mbbs-physio-76', name: 'Cardiac cycle' },
                { id: 'mbbs-physio-77', name: 'ECG' },
                { id: 'mbbs-physio-78', name: 'Oxyhemoglobin dissociation curve' },
                { id: 'mbbs-physio-79', name: 'GFR regulation' },
                { id: 'mbbs-physio-80', name: 'Action potential' },
                { id: 'mbbs-physio-81', name: 'Menstrual cycle' },
                { id: 'mbbs-physio-82', name: 'Thyroid hormone functions' },
                { id: 'mbbs-physio-83', name: 'Baroreceptor reflex' },
                { id: 'mbbs-physio-84', name: 'Acid-base disorders' },
            ]},
        ]
    },
    {
        id: 'mbbs-s3', name: 'Biochemistry',
        sections: [
            { id: 'mbbs-s3-sec1', name: 'Cell & Bio molecules: Carbohydrates', topics: [
                { id: 'mbbs-bio-1', name: 'Classification with examples' },
                { id: 'mbbs-bio-2', name: 'Isomerism (epimers, anomers, mutarotation)' },
                { id: 'mbbs-bio-3', name: 'Glycosidic bond' },
                { id: 'mbbs-bio-4', name: 'Reducing vs non-reducing sugars' },
                { id: 'mbbs-bio-5', name: 'Biological importance' },
            ]},
            { id: 'mbbs-s3-sec2', name: 'Cell & Bio molecules: Lipids', topics: [
                { id: 'mbbs-bio-6', name: 'Classification' },
                { id: 'mbbs-bio-7', name: 'Essential fatty acids' },
                { id: 'mbbs-bio-8', name: 'Phospholipids & sphingolipids' },
                { id: 'mbbs-bio-9', name: 'Cholesterol – structure & functions' },
                { id: 'mbbs-bio-10', name: 'Lipoproteins (types & functions)' },
            ]},
            { id: 'mbbs-s3-sec3', name: 'Cell & Bio molecules: Proteins', topics: [
                { id: 'mbbs-bio-11', name: 'Levels of protein structure' },
                { id: 'mbbs-bio-12', name: 'Bonds stabilizing structure' },
                { id: 'mbbs-bio-13', name: 'Denaturation' },
                { id: 'mbbs-bio-14', name: 'Fibrous vs globular proteins' },
                { id: 'mbbs-bio-15', name: 'Hemoglobin structure (brief intro)' },
            ]},
            { id: 'mbbs-s3-sec4', name: 'Cell & Bio molecules: Enzymes', topics: [
                { id: 'mbbs-bio-16', name: 'Classification (IUB system)' },
                { id: 'mbbs-bio-17', name: 'Michaelis-Menten equation' },
                { id: 'mbbs-bio-18', name: 'Km & Vmax' },
                { id: 'mbbs-bio-19', name: 'Enzyme inhibition (competitive/non-competitive)' },
                { id: 'mbbs-bio-20', name: 'Isoenzymes (LDH, CK)' },
                { id: 'mbbs-bio-21', name: 'Clinical enzymology' },
            ]},
            { id: 'mbbs-s3-sec5', name: 'Bioenergetics & Metabolism: Carbohydrate Metabolism', topics: [
                { id: 'mbbs-bio-22', name: 'Glycolysis (steps + regulation)' },
                { id: 'mbbs-bio-23', name: 'TCA cycle' },
                { id: 'mbbs-bio-24', name: 'Gluconeogenesis' },
                { id: 'mbbs-bio-25', name: 'Glycogen metabolism' },
                { id: 'mbbs-bio-26', name: 'HMP shunt' },
                { id: 'mbbs-bio-27', name: 'Regulation of blood glucose' },
                { id: 'mbbs-bio-28', name: 'Diabetes mellitus – biochemical basis' },
            ]},
            { id: 'mbbs-s3-sec6', name: 'Bioenergetics & Metabolism: Lipid Metabolism', topics: [
                { id: 'mbbs-bio-29', name: 'β-oxidation' },
                { id: 'mbbs-bio-30', name: 'Fatty acid synthesis' },
                { id: 'mbbs-bio-31', name: 'Ketone bodies' },
                { id: 'mbbs-bio-32', name: 'Cholesterol synthesis' },
                { id: 'mbbs-bio-33', name: 'Dyslipidemia' },
            ]},
            { id: 'mbbs-s3-sec7', name: 'Bioenergetics & Metabolism: Protein & Amino Acid Metabolism', topics: [
                { id: 'mbbs-bio-34', name: 'Transamination & deamination' },
                { id: 'mbbs-bio-35', name: 'Urea cycle' },
                { id: 'mbbs-bio-36', name: 'Inborn errors (PKU, Alkaptonuria, MSUD)' },
                { id: 'mbbs-bio-37', name: 'Plasma proteins' },
                { id: 'mbbs-bio-38', name: 'Nitrogen balance' },
            ]},
            { id: 'mbbs-s3-sec8', name: 'Bioenergetics & Metabolism: Integration of Metabolism', topics: [
                { id: 'mbbs-bio-39', name: 'Fed vs fasting state' },
                { id: 'mbbs-bio-40', name: 'Starvation' },
                { id: 'mbbs-bio-41', name: 'Hormonal regulation (Insulin, Glucagon)' },
            ]},
            { id: 'mbbs-s3-sec9', name: 'Molecular Biology', topics: [
                { id: 'mbbs-bio-42', name: 'DNA structure' },
                { id: 'mbbs-bio-43', name: 'DNA replication' },
                { id: 'mbbs-bio-44', name: 'Transcription' },
                { id: 'mbbs-bio-45', name: 'Translation' },
                { id: 'mbbs-bio-46', name: 'Genetic code' },
                { id: 'mbbs-bio-47', name: 'Gene regulation (Lac operon – basic idea)' },
                { id: 'mbbs-bio-48', name: 'PCR, blotting techniques' },
                { id: 'mbbs-bio-49', name: 'Mutations' },
                { id: 'mbbs-bio-50', name: 'Recombinant DNA technology' },
            ]},
            { id: 'mbbs-s3-sec10', name: 'Hemoglobin & Related Topics', topics: [
                { id: 'mbbs-bio-51', name: 'Structure of hemoglobin' },
                { id: 'mbbs-bio-52', name: 'Oxygen dissociation curve' },
                { id: 'mbbs-bio-53', name: 'Bohr effect' },
                { id: 'mbbs-bio-54', name: 'Hemoglobinopathies (Sickle cell, Thalassemia)' },
                { id: 'mbbs-bio-55', name: 'Heme synthesis & porphyrias' },
                { id: 'mbbs-bio-56', name: 'Jaundice (types & lab findings)' },
            ]},
            { id: 'mbbs-s3-sec11', name: 'Clinical Biochemistry', topics: [
                { id: 'mbbs-bio-57', name: 'Liver function tests (LFT)' },
                { id: 'mbbs-bio-58', name: 'Renal function tests (RFT)' },
                { id: 'mbbs-bio-59', name: 'Thyroid function tests' },
                { id: 'mbbs-bio-60', name: 'Cardiac markers (CK-MB, Troponin)' },
                { id: 'mbbs-bio-61', name: 'Acid-base balance' },
                { id: 'mbbs-bio-62', name: 'Electrolytes' },
            ]},
            { id: 'mbbs-s3-sec12', name: 'Vitamins & Minerals: Vitamins', topics: [
                { id: 'mbbs-bio-63', name: 'Fat-soluble vs water-soluble' },
                { id: 'mbbs-bio-64', name: 'Deficiency diseases' },
                { id: 'mbbs-bio-65', name: 'Biochemical functions' },
            ]},
            { id: 'mbbs-s3-sec13', name: 'Vitamins & Minerals: Minerals', topics: [
                { id: 'mbbs-bio-66', name: 'Calcium metabolism' },
                { id: 'mbbs-bio-67', name: 'Iron metabolism' },
                { id: 'mbbs-bio-68', name: 'Iodine' },
                { id: 'mbbs-bio-69', name: 'Trace elements (Zinc, Copper)' },
            ]},
            { id: 'mbbs-s3-sec14', name: 'Vitamins & Minerals: Nutrition', topics: [
                { id: 'mbbs-bio-70', name: 'Balanced diet' },
                { id: 'mbbs-bio-71', name: 'BMI' },
                { id: 'mbbs-bio-72', name: 'PEM (Kwashiorkor, Marasmus)' },
                { id: 'mbbs-bio-73', name: 'Obesity' },
                { id: 'mbbs-bio-74', name: 'Dietary fiber' },
            ]},
            { id: 'mbbs-s3-sec15', name: 'Acid-Base Balance', topics: [
                { id: 'mbbs-bio-75', name: 'Buffer systems' },
                { id: 'mbbs-bio-76', name: 'Henderson-Hasselbalch equation' },
                { id: 'mbbs-bio-77', name: 'Respiratory & metabolic acidosis/alkalosis' },
            ]},
            { id: 'mbbs-s3-sec16', name: 'Practical-Important Topics', topics: [
                { id: 'mbbs-bio-78', name: 'Benedict’s test' },
                { id: 'mbbs-bio-79', name: 'Biuret test' },
                { id: 'mbbs-bio-80', name: 'Seliwanoff’s test' },
                { id: 'mbbs-bio-81', name: 'Rothera’s test' },
                { id: 'mbbs-bio-82', name: 'Colorimetry' },
                { id: 'mbbs-bio-83', name: 'Electrophoresis' },
                { id: 'mbbs-bio-84', name: 'Urine analysis' },
            ]},
        ]
    },
    {
        id: 'mbbs-s4', name: 'Pathology',
        sections: [
            { id: 'mbbs-s4-sec1', name: 'General Pathology: Cell Injury & Adaptation', topics: [
                { id: 'mbbs-path-1', name: 'Reversible vs irreversible cell injury' },
                { id: 'mbbs-path-2', name: 'Necrosis – types (coagulative, liquefactive, caseous, fat, fibrinoid)' },
                { id: 'mbbs-path-3', name: 'Apoptosis – intrinsic & extrinsic pathways' },
                { id: 'mbbs-path-4', name: 'Cellular adaptations – hypertrophy, hyperplasia, metaplasia, dysplasia' },
                { id: 'mbbs-path-5', name: 'Free radical injury' },
                { id: 'mbbs-path-6', name: 'Ischemia–reperfusion injury' },
            ]},
            { id: 'mbbs-s4-sec2', name: 'General Pathology: Acute & Chronic Inflammation', topics: [
                { id: 'mbbs-path-7', name: 'Vascular and cellular events of acute inflammation' },
                { id: 'mbbs-path-8', name: 'Chemical mediators of inflammation' },
                { id: 'mbbs-path-9', name: 'Types of inflammatory exudates' },
                { id: 'mbbs-path-10', name: 'Chronic inflammation – granuloma (TB granuloma)' },
                { id: 'mbbs-path-11', name: 'Differences: acute vs chronic inflammation' },
                { id: 'mbbs-path-12', name: 'Healing & repair' },
            ]},
            { id: 'mbbs-s4-sec3', name: 'General Pathology: Hemodynamic Disorders', topics: [
                { id: 'mbbs-path-13', name: 'Edema – pathogenesis' },
                { id: 'mbbs-path-14', name: 'Thrombosis – Virchow’s triad' },
                { id: 'mbbs-path-15', name: 'Embolism (pulmonary, fat, air)' },
                { id: 'mbbs-path-16', name: 'Infarction – red vs white' },
                { id: 'mbbs-path-17', name: 'Shock – types & stages' },
                { id: 'mbbs-path-18', name: 'DIC' },
            ]},
            { id: 'mbbs-s4-sec4', name: 'General Pathology: Neoplasia', topics: [
                { id: 'mbbs-path-19', name: 'Definitions: benign vs malignant' },
                { id: 'mbbs-path-20', name: 'Hallmarks of cancer' },
                { id: 'mbbs-path-21', name: 'Carcinogenesis – chemical, viral' },
                { id: 'mbbs-path-22', name: 'Oncogenes & tumor suppressor genes (p53, Rb)' },
                { id: 'mbbs-path-23', name: 'Tumor markers' },
                { id: 'mbbs-path-24', name: 'Grading vs staging' },
                { id: 'mbbs-path-25', name: 'Metastasis' },
            ]},
            { id: 'mbbs-s4-sec5', name: 'General Pathology: Genetic Disorders', topics: [
                { id: 'mbbs-path-26', name: 'Types of mutations' },
                { id: 'mbbs-path-27', name: 'Chromosomal abnormalities (Down syndrome)' },
                { id: 'mbbs-path-28', name: 'Single gene disorders' },
                { id: 'mbbs-path-29', name: 'Inheritance patterns' },
            ]},
            { id: 'mbbs-s4-sec6', name: 'General Pathology: Immunopathology', topics: [
                { id: 'mbbs-path-30', name: 'Hypersensitivity reactions (Type I–IV)' },
                { id: 'mbbs-path-31', name: 'Autoimmune diseases (SLE, RA)' },
                { id: 'mbbs-path-32', name: 'Immunodeficiency (HIV basics)' },
                { id: 'mbbs-path-33', name: 'Transplant rejection' },
            ]},
            { id: 'mbbs-s4-sec7', name: 'General Pathology: Environmental & Nutritional Disorders', topics: [
                { id: 'mbbs-path-34', name: 'Protein energy malnutrition' },
                { id: 'mbbs-path-35', name: 'Vitamin deficiencies' },
                { id: 'mbbs-path-36', name: 'Obesity' },
                { id: 'mbbs-path-37', name: 'Amyloidosis' },
            ]},
            { id: 'mbbs-s4-sec8', name: 'Systemic Pathology: Cardiovascular System', topics: [
                { id: 'mbbs-path-38', name: 'Atherosclerosis' },
                { id: 'mbbs-path-39', name: 'Hypertension pathology' },
                { id: 'mbbs-path-40', name: 'Ischemic heart disease' },
                { id: 'mbbs-path-41', name: 'Myocardial infarction – evolution' },
                { id: 'mbbs-path-42', name: 'Rheumatic fever' },
                { id: 'mbbs-path-43', name: 'Infective endocarditis' },
                { id: 'mbbs-path-44', name: 'Cardiomyopathies' },
            ]},
            { id: 'mbbs-s4-sec9', name: 'Systemic Pathology: Respiratory System', topics: [
                { id: 'mbbs-path-45', name: 'Pneumonia – types' },
                { id: 'mbbs-path-46', name: 'Tuberculosis' },
                { id: 'mbbs-path-47', name: 'COPD (chronic bronchitis, emphysema)' },
                { id: 'mbbs-path-48', name: 'Bronchial asthma' },
                { id: 'mbbs-path-49', name: 'Lung carcinoma' },
            ]},
            { id: 'mbbs-s4-sec10', name: 'Systemic Pathology: CNS', topics: [
                { id: 'mbbs-path-50', name: 'Meningitis' },
                { id: 'mbbs-path-51', name: 'Brain tumors' },
                { id: 'mbbs-path-52', name: 'Stroke' },
                { id: 'mbbs-path-53', name: 'Cerebral edema' },
            ]},
            { id: 'mbbs-s4-sec11', name: 'Systemic Pathology: Hematology', topics: [
                { id: 'mbbs-path-54', name: 'Anemias (iron deficiency, megaloblastic, hemolytic)' },
                { id: 'mbbs-path-55', name: 'Thalassemia' },
                { id: 'mbbs-path-56', name: 'Leukemias (ALL, AML, CML, CLL)' },
                { id: 'mbbs-path-57', name: 'Lymphomas (Hodgkin vs Non-Hodgkin)' },
                { id: 'mbbs-path-58', name: 'ITP' },
                { id: 'mbbs-path-59', name: 'Hemophilia' },
            ]},
            { id: 'mbbs-s4-sec12', name: 'Systemic Pathology: Gastrointestinal Tract', topics: [
                { id: 'mbbs-path-60', name: 'Peptic ulcer' },
                { id: 'mbbs-path-61', name: 'Gastric carcinoma' },
                { id: 'mbbs-path-62', name: 'Colorectal carcinoma' },
                { id: 'mbbs-path-63', name: 'Inflammatory bowel disease' },
                { id: 'mbbs-path-64', name: 'Liver cirrhosis' },
                { id: 'mbbs-path-65', name: 'Viral hepatitis' },
                { id: 'mbbs-path-66', name: 'Hepatocellular carcinoma' },
            ]},
            { id: 'mbbs-s4-sec13', name: 'Systemic Pathology: Hepatobiliary System', topics: [
                { id: 'mbbs-path-67', name: 'Jaundice – types' },
                { id: 'mbbs-path-68', name: 'Fatty liver' },
                { id: 'mbbs-path-69', name: 'Portal hypertension' },
            ]},
            { id: 'mbbs-s4-sec14', name: 'Systemic Pathology: Renal System', topics: [
                { id: 'mbbs-path-70', name: 'Glomerulonephritis (PSGN, nephrotic syndrome)' },
                { id: 'mbbs-path-71', name: 'Acute kidney injury' },
                { id: 'mbbs-path-72', name: 'Chronic kidney disease' },
                { id: 'mbbs-path-73', name: 'Renal cell carcinoma' },
            ]},
            { id: 'mbbs-s4-sec15', name: 'Systemic Pathology: Endocrine System', topics: [
                { id: 'mbbs-path-74', name: 'Diabetes mellitus – pathology' },
                { id: 'mbbs-path-75', name: 'Thyroid disorders (Graves, Hashimoto)' },
                { id: 'mbbs-path-76', name: 'Goiter' },
                { id: 'mbbs-path-77', name: 'Thyroid carcinoma' },
                { id: 'mbbs-path-78', name: 'Adrenal tumors' },
            ]},
            { id: 'mbbs-s4-sec16', name: 'Systemic Pathology: Female Genital Tract', topics: [
                { id: 'mbbs-path-79', name: 'Cervical carcinoma' },
                { id: 'mbbs-path-80', name: 'Endometrial carcinoma' },
                { id: 'mbbs-path-81', name: 'Ovarian tumors' },
                { id: 'mbbs-path-82', name: 'Breast carcinoma' },
                { id: 'mbbs-path-83', name: 'Fibroadenoma' },
            ]},
            { id: 'mbbs-s4-sec17', name: 'Systemic Pathology: Male Genital Tract', topics: [
                { id: 'mbbs-path-84', name: 'Prostatic hyperplasia' },
                { id: 'mbbs-path-85', name: 'Carcinoma prostate' },
                { id: 'mbbs-path-86', name: 'Testicular tumors' },
            ]},
            { id: 'mbbs-s4-sec18', name: 'Systemic Pathology: Bone & Soft Tissue', topics: [
                { id: 'mbbs-path-87', name: 'Osteomyelitis' },
                { id: 'mbbs-path-88', name: 'Osteosarcoma' },
                { id: 'mbbs-path-89', name: 'Giant cell tumor' },
            ]},
            { id: 'mbbs-s4-sec19', name: 'Most Frequently Asked Long Essay Topics', topics: [
                { id: 'mbbs-path-90', name: 'Myocardial infarction' },
                { id: 'mbbs-path-91', name: 'Neoplasia' },
                { id: 'mbbs-path-92', name: 'Acute inflammation' },
                { id: 'mbbs-path-93', name: 'Tuberculosis' },
                { id: 'mbbs-path-94', name: 'Iron deficiency anemia' },
                { id: 'mbbs-path-95', name: 'Nephrotic syndrome' },
                { id: 'mbbs-path-96', name: 'Cirrhosis liver' },
                { id: 'mbbs-path-97', name: 'Carcinoma cervix' },
            ]},
        ]
    },
    {
        id: 'mbbs-s5', name: 'Microbiology',
        sections: [
            { id: 'mbbs-s5-sec1', name: 'General Microbiology', topics: [
                { id: 'mbbs-micro-1', name: 'History & contributions of Louis Pasteur & Robert Koch' },
                { id: 'mbbs-micro-2', name: 'Koch’s postulates' },
                { id: 'mbbs-micro-3', name: 'Sterilization & disinfection (methods, indicators)' },
                { id: 'mbbs-micro-4', name: 'Culture media (enriched, selective, differential)' },
                { id: 'mbbs-micro-5', name: 'Bacterial growth curve' },
                { id: 'mbbs-micro-6', name: 'Bacterial genetics (transformation, transduction, conjugation)' },
                { id: 'mbbs-micro-7', name: 'Antimicrobial susceptibility testing (Kirby-Bauer)' },
                { id: 'mbbs-micro-8', name: 'Mechanism of antibiotic resistance' },
                { id: 'mbbs-micro-9', name: 'Biomedical waste management' },
                { id: 'mbbs-micro-10', name: 'Hospital acquired infections' },
            ]},
            { id: 'mbbs-s5-sec2', name: 'Immunology', topics: [
                { id: 'mbbs-micro-11', name: 'Types of immunity (innate vs adaptive)' },
                { id: 'mbbs-micro-12', name: 'Cells of immune system' },
                { id: 'mbbs-micro-13', name: 'Antigen & antibody (structure of IgG)' },
                { id: 'mbbs-micro-14', name: 'Hypersensitivity reactions (Type I–IV)' },
                { id: 'mbbs-micro-15', name: 'Complement system' },
                { id: 'mbbs-micro-16', name: 'MHC (Class I & II)' },
                { id: 'mbbs-micro-17', name: 'Vaccines (live, killed, toxoid, recombinant)' },
                { id: 'mbbs-micro-18', name: 'ELISA principle' },
                { id: 'mbbs-micro-19', name: 'Autoimmunity' },
                { id: 'mbbs-micro-20', name: 'Transplant rejection' },
            ]},
            { id: 'mbbs-s5-sec3', name: 'Systemic Bacteriology: Gram Positive Cocci', topics: [
                { id: 'mbbs-micro-21', name: 'Staphylococcus aureus (MRSA, toxins)' },
                { id: 'mbbs-micro-22', name: 'Streptococcus pyogenes' },
                { id: 'mbbs-micro-23', name: 'Streptococcus pneumoniae' },
            ]},
            { id: 'mbbs-s5-sec4', name: 'Systemic Bacteriology: Gram Negative Cocci', topics: [
                { id: 'mbbs-micro-24', name: 'Neisseria meningitidis' },
                { id: 'mbbs-micro-25', name: 'Neisseria gonorrhoeae' },
            ]},
            { id: 'mbbs-s5-sec5', name: 'Systemic Bacteriology: Gram Positive Bacilli', topics: [
                { id: 'mbbs-micro-26', name: 'Corynebacterium diphtheriae' },
                { id: 'mbbs-micro-27', name: 'Clostridium tetani' },
                { id: 'mbbs-micro-28', name: 'Clostridium perfringens' },
                { id: 'mbbs-micro-29', name: 'Bacillus anthracis' },
            ]},
            { id: 'mbbs-s5-sec6', name: 'Systemic Bacteriology: Gram Negative Bacilli', topics: [
                { id: 'mbbs-micro-30', name: 'Escherichia coli' },
                { id: 'mbbs-micro-31', name: 'Salmonella typhi' },
                { id: 'mbbs-micro-32', name: 'Vibrio cholerae' },
                { id: 'mbbs-micro-33', name: 'Pseudomonas aeruginosa' },
                { id: 'mbbs-micro-34', name: 'Klebsiella pneumoniae' },
            ]},
            { id: 'mbbs-s5-sec7', name: 'Systemic Bacteriology: Mycobacteria', topics: [
                { id: 'mbbs-micro-35', name: 'Mycobacterium tuberculosis' },
                { id: 'mbbs-micro-36', name: 'Mycobacterium leprae' },
            ]},
            { id: 'mbbs-s5-sec8', name: 'Virology', topics: [
                { id: 'mbbs-micro-37', name: 'General properties of viruses' },
                { id: 'mbbs-micro-38', name: 'Viral replication' },
                { id: 'mbbs-micro-39', name: 'Human immunodeficiency virus' },
                { id: 'mbbs-micro-40', name: 'Hepatitis B virus' },
                { id: 'mbbs-micro-41', name: 'Hepatitis C virus' },
                { id: 'mbbs-micro-42', name: 'Dengue virus' },
                { id: 'mbbs-micro-43', name: 'Rabies virus' },
                { id: 'mbbs-micro-44', name: 'Influenza virus' },
                { id: 'mbbs-micro-45', name: 'Coronavirus' },
                { id: 'mbbs-micro-46', name: 'Polio virus' },
            ]},
            { id: 'mbbs-s5-sec9', name: 'Mycology', topics: [
                { id: 'mbbs-micro-47', name: 'Morphology of fungi' },
                { id: 'mbbs-micro-48', name: 'Candida albicans' },
                { id: 'mbbs-micro-49', name: 'Aspergillus fumigatus' },
                { id: 'mbbs-micro-50', name: 'Cryptococcus neoformans' },
                { id: 'mbbs-micro-51', name: 'Dermatophytes' },
                { id: 'mbbs-micro-52', name: 'Systemic mycoses' },
            ]},
            { id: 'mbbs-s5-sec10', name: 'Parasitology', topics: [
                { id: 'mbbs-micro-53', name: 'Protozoa' },
                { id: 'mbbs-micro-54', name: 'Plasmodium falciparum' },
                { id: 'mbbs-micro-55', name: 'Entamoeba histolytica' },
                { id: 'mbbs-micro-56', name: 'Giardia lamblia' },
                { id: 'mbbs-micro-57', name: 'Leishmania' },
                { id: 'mbbs-micro-58', name: 'Helminths' },
                { id: 'mbbs-micro-59', name: 'Ascaris lumbricoides' },
                { id: 'mbbs-micro-60', name: 'Hookworm' },
                { id: 'mbbs-micro-61', name: 'Taenia' },
                { id: 'mbbs-micro-62', name: 'Wuchereria bancrofti' },
            ]},
            { id: 'mbbs-s5-sec11', name: 'Applied Microbiology', topics: [
                { id: 'mbbs-micro-63', name: 'Specimen collection & transport' },
                { id: 'mbbs-micro-64', name: 'Blood culture' },
                { id: 'mbbs-micro-65', name: 'Urine culture' },
                { id: 'mbbs-micro-66', name: 'CSF examination' },
                { id: 'mbbs-micro-67', name: 'Sputum examination for TB' },
                { id: 'mbbs-micro-68', name: 'RNTCP / NTEP' },
                { id: 'mbbs-micro-69', name: 'National immunization schedule (India)' },
                { id: 'mbbs-micro-70', name: 'Post exposure prophylaxis (Rabies, HIV, HBV)' },
            ]},
        ]
    },
    {
        id: 'mbbs-s6', name: 'Pharmacology',
        sections: [
            { id: 'mbbs-s6-sec1', name: 'General Pharmacology', topics: [
                { id: 'mbbs-pharma-1', name: 'Routes of drug administration' },
                { id: 'mbbs-pharma-2', name: 'Transport of drug across cell membrane' },
                { id: 'mbbs-pharma-3', name: 'Bio Availability, Dose Response Curve' },
                { id: 'mbbs-pharma-4', name: 'Volume of drug administration, Plasma Protein Binding, Plasma half life' },
                { id: 'mbbs-pharma-5', name: 'Drug Antagonisms' },
                { id: 'mbbs-pharma-6', name: 'First Pass Metabolism' },
                { id: 'mbbs-pharma-7', name: 'Factors modifying drug action' },
                { id: 'mbbs-pharma-8', name: 'Clinical Trials' },
                { id: 'mbbs-pharma-9', name: 'Adverse Drug Reactions' },
                { id: 'mbbs-pharma-10', name: 'Bio Transformation' },
                { id: 'mbbs-pharma-11', name: 'CyP450' },
                { id: 'mbbs-pharma-12', name: 'Pharmacovigilance' },
                { id: 'mbbs-pharma-13', name: 'Sources of drugs' },
            ]},
            { id: 'mbbs-s6-sec2', name: 'Autonomic Nervous System', topics: [
                { id: 'mbbs-pharma-14', name: 'Atropine substitutes and its Uses' },
                { id: 'mbbs-pharma-15', name: 'Adrenaline' },
                { id: 'mbbs-pharma-16', name: 'Anticholinesterases and OP poisoning' },
                { id: 'mbbs-pharma-17', name: 'Alpha1 selective blockers' },
                { id: 'mbbs-pharma-18', name: 'Beta blockers' },
                { id: 'mbbs-pharma-19', name: 'Drugs for Glaucoma' },
                { id: 'mbbs-pharma-20', name: 'Myasthenia Gravis' },
                { id: 'mbbs-pharma-21', name: 'Belladona Poisoning' },
            ]},
            { id: 'mbbs-s6-sec3', name: 'Autocoids', topics: [
                { id: 'mbbs-pharma-22', name: 'Antihistamines-3 generations' },
                { id: 'mbbs-pharma-23', name: 'Drugs for Migraine' },
                { id: 'mbbs-pharma-24', name: 'Aspirin' },
                { id: 'mbbs-pharma-25', name: 'Paracetamol' },
                { id: 'mbbs-pharma-26', name: 'Selective COX-2 Inhibitors' },
                { id: 'mbbs-pharma-27', name: 'Antigout drugs' },
                { id: 'mbbs-pharma-28', name: 'NSAIDs Uses' },
                { id: 'mbbs-pharma-29', name: 'DMARDs' },
            ]},
            { id: 'mbbs-s6-sec4', name: 'Respiratory System', topics: [
                { id: 'mbbs-pharma-30', name: 'Beta Agonists' },
                { id: 'mbbs-pharma-31', name: 'Theophylline' },
                { id: 'mbbs-pharma-32', name: 'Antitussives and Expectorants' },
                { id: 'mbbs-pharma-33', name: 'Status Asthmaticus' },
            ]},
            { id: 'mbbs-s6-sec5', name: 'GIT', topics: [
                { id: 'mbbs-pharma-34', name: 'Proton Pump Inhibitors' },
                { id: 'mbbs-pharma-35', name: 'Antiemetics' },
                { id: 'mbbs-pharma-36', name: 'Pharmacotherapy of H.Pylori' },
                { id: 'mbbs-pharma-37', name: 'Prebiotics and Probiotics' },
            ]},
            { id: 'mbbs-s6-sec6', name: 'Hormones', topics: [
                { id: 'mbbs-pharma-38', name: 'Antithyroid drugs' },
                { id: 'mbbs-pharma-39', name: 'Insulin preparations' },
                { id: 'mbbs-pharma-40', name: 'Oral Antidiabetics-Metformin, Sulfonyl Ureas' },
                { id: 'mbbs-pharma-41', name: 'Oral Contraceptives-Uses and Adverse effects' },
                { id: 'mbbs-pharma-42', name: 'Tocolytics' },
            ]},
            { id: 'mbbs-s6-sec7', name: 'PNS', topics: [
                { id: 'mbbs-pharma-43', name: 'Tubocurarine, Suxamethonium' },
                { id: 'mbbs-pharma-44', name: 'Lignocaine' },
            ]},
            { id: 'mbbs-s6-sec8', name: 'Central Nervous System', topics: [
                { id: 'mbbs-pharma-45', name: 'General Anaesthetics (IV, Inhalational)' },
                { id: 'mbbs-pharma-46', name: 'Antiepileptics-Phenytoin, Valproate' },
                { id: 'mbbs-pharma-47', name: 'Benzodiazepines, Barbiturates' },
                { id: 'mbbs-pharma-48', name: 'Levodopa and Carbidopa combination uses' },
                { id: 'mbbs-pharma-49', name: 'Antipsychotics (Typical and Atypical)' },
                { id: 'mbbs-pharma-50', name: 'SSRI’s' },
                { id: 'mbbs-pharma-51', name: 'Morphine, Opioid Receptor Antagonists' },
            ]},
            { id: 'mbbs-s6-sec9', name: 'Cardiovascular System', topics: [
                { id: 'mbbs-pharma-52', name: 'ACE Inhibitors, ARB’s' },
                { id: 'mbbs-pharma-53', name: 'Vasodilators-Nitrates' },
                { id: 'mbbs-pharma-54', name: 'Calcium channel blockers' },
                { id: 'mbbs-pharma-55', name: 'Digoxin' },
                { id: 'mbbs-pharma-56', name: 'Antiarrhythmic drugs classification' },
            ]},
            { id: 'mbbs-s6-sec10', name: 'Blood', topics: [
                { id: 'mbbs-pharma-57', name: 'Heparin and Warfarin' },
                { id: 'mbbs-pharma-58', name: 'Oral and Parenteral Iron preparations' },
                { id: 'mbbs-pharma-59', name: 'Fibrinolytics' },
                { id: 'mbbs-pharma-60', name: 'Clopidogrel' },
                { id: 'mbbs-pharma-61', name: 'Statins' },
            ]},
            { id: 'mbbs-s6-sec11', name: 'Antimicrobials', topics: [
                { id: 'mbbs-pharma-62', name: 'Penicillin' },
                { id: 'mbbs-pharma-63', name: 'Cephalosporins' },
                { id: 'mbbs-pharma-64', name: 'Aminoglycosides' },
                { id: 'mbbs-pharma-65', name: 'General principles and selective toxicity of Chemotherapy' },
                { id: 'mbbs-pharma-66', name: '1st and 2nd generation Antitubercular drugs' },
                { id: 'mbbs-pharma-67', name: 'Cotrimoxazole' },
                { id: 'mbbs-pharma-68', name: 'Tetracyclines' },
                { id: 'mbbs-pharma-69', name: 'Chloroquine and Artemisinin compounds' },
                { id: 'mbbs-pharma-70', name: 'Antifungals' },
                { id: 'mbbs-pharma-71', name: 'Antiretroviral drugs' },
                { id: 'mbbs-pharma-72', name: 'Albendazole, Ivermectin' },
                { id: 'mbbs-pharma-73', name: 'Vinca Alkaloids, Platin compounds' },
                { id: 'mbbs-pharma-74', name: 'Methotrexate' },
                { id: 'mbbs-pharma-75', name: 'Purine and Pyrimidine antagonists' },
                { id: 'mbbs-pharma-76', name: 'Calcineurin and m-TOR Inhibitors' },
                { id: 'mbbs-pharma-77', name: 'Broad Spectrum Antibiotics' },
            ]},
            { id: 'mbbs-s6-sec12', name: 'Miscellaneous', topics: [
                { id: 'mbbs-pharma-78', name: 'Chelating Agents-EDTA, Iron poisoning' },
                { id: 'mbbs-pharma-79', name: 'Vitamin D' },
                { id: 'mbbs-pharma-80', name: 'Antiseptics and Disinfectants' },
            ]},
        ]
    },
    {
        id: 'mbbs-s7', name: 'Forensic Medicine & Toxicology (FMT)',
        sections: [
            { id: 'mbbs-s7-sec1', name: 'Introduction & Legal Procedures', topics: [
                { id: 'mbbs-fmt-1', name: 'History of Forensic Medicine' },
                { id: 'mbbs-fmt-2', name: 'Types of courts in India' },
                { id: 'mbbs-fmt-3', name: 'Inquest (Police & Magistrate)' },
                { id: 'mbbs-fmt-4', name: 'Summons & conduct of medical witness' },
                { id: 'mbbs-fmt-5', name: 'Medical ethics & professional misconduct' },
                { id: 'mbbs-fmt-6', name: 'Consent (types, age, MTP consent)' },
                { id: 'mbbs-fmt-7', name: 'Medical negligence & IPC sections related to doctors' },
                { id: 'mbbs-fmt-8', name: 'Consumer Protection Act' },
            ]},
            { id: 'mbbs-s7-sec2', name: 'Identification', topics: [
                { id: 'mbbs-fmt-9', name: 'Age estimation (teeth, ossification centers)' },
                { id: 'mbbs-fmt-10', name: 'Sex determination (pelvis, skull differences)' },
                { id: 'mbbs-fmt-11', name: 'Stature estimation' },
                { id: 'mbbs-fmt-12', name: 'Racial identification' },
                { id: 'mbbs-fmt-13', name: 'Superimposition' },
                { id: 'mbbs-fmt-14', name: 'DNA fingerprinting' },
                { id: 'mbbs-fmt-15', name: 'Fingerprints (types & patterns)' },
            ]},
            { id: 'mbbs-s7-sec3', name: 'Thanatology (Death & Postmortem Changes)', topics: [
                { id: 'mbbs-fmt-16', name: 'Definition & types of death' },
                { id: 'mbbs-fmt-17', name: 'Brain death' },
                { id: 'mbbs-fmt-18', name: 'Somatic & molecular death' },
                { id: 'mbbs-fmt-19', name: 'Postmortem changes:' },
                { id: 'mbbs-fmt-20', name: 'Livor mortis' },
                { id: 'mbbs-fmt-21', name: 'Rigor mortis' },
                { id: 'mbbs-fmt-22', name: 'Algor mortis' },
                { id: 'mbbs-fmt-23', name: 'Decomposition' },
                { id: 'mbbs-fmt-24', name: 'Estimation of time since death' },
                { id: 'mbbs-fmt-25', name: 'Suspended animation' },
                { id: 'mbbs-fmt-26', name: 'Autopsy types & steps' },
            ]},
            { id: 'mbbs-s7-sec4', name: 'Mechanical Injuries', topics: [
                { id: 'mbbs-fmt-27', name: 'Abrasion, contusion, laceration' },
                { id: 'mbbs-fmt-28', name: 'Incised, stab, chop wounds' },
                { id: 'mbbs-fmt-29', name: 'Firearm injuries' },
                { id: 'mbbs-fmt-30', name: 'Blast injuries' },
                { id: 'mbbs-fmt-31', name: 'Defense wounds' },
                { id: 'mbbs-fmt-32', name: 'Injury certificate writing' },
                { id: 'mbbs-fmt-33', name: 'Medicolegal importance of wounds' },
            ]},
            { id: 'mbbs-s7-sec5', name: 'Asphyxia', topics: [
                { id: 'mbbs-fmt-34', name: 'Hanging (typical vs atypical)' },
                { id: 'mbbs-fmt-35', name: 'Strangulation (ligature/manual)' },
                { id: 'mbbs-fmt-36', name: 'Drowning (wet vs dry)' },
                { id: 'mbbs-fmt-37', name: 'Smothering & choking' },
                { id: 'mbbs-fmt-38', name: 'Traumatic asphyxia' },
                { id: 'mbbs-fmt-39', name: 'Difference between hanging & strangulation' },
            ]},
            { id: 'mbbs-s7-sec6', name: 'Sexual Offences', topics: [
                { id: 'mbbs-fmt-40', name: 'Rape (new legal definitions)' },
                { id: 'mbbs-fmt-41', name: 'POCSO Act' },
                { id: 'mbbs-fmt-42', name: 'Examination of sexual assault victim' },
                { id: 'mbbs-fmt-43', name: 'Virginity signs & hymen types' },
                { id: 'mbbs-fmt-44', name: 'Sodomy & unnatural offences' },
                { id: 'mbbs-fmt-45', name: 'Impotence & sterility' },
                { id: 'mbbs-fmt-46', name: 'Collection & preservation of evidence' },
            ]},
            { id: 'mbbs-s7-sec7', name: 'Obstetric Forensic Medicine', topics: [
                { id: 'mbbs-fmt-47', name: 'Signs of pregnancy' },
                { id: 'mbbs-fmt-48', name: 'Superfecundation & superfetation' },
                { id: 'mbbs-fmt-49', name: 'Legitimacy & paternity' },
                { id: 'mbbs-fmt-50', name: 'Criminal abortion' },
                { id: 'mbbs-fmt-51', name: 'Infanticide' },
                { id: 'mbbs-fmt-52', name: 'Foeticide' },
            ]},
            { id: 'mbbs-s7-sec8', name: 'Thermal Injuries', topics: [
                { id: 'mbbs-fmt-53', name: 'Burns (degree & rule of 9)' },
                { id: 'mbbs-fmt-54', name: 'Antemortem vs postmortem burns' },
                { id: 'mbbs-fmt-55', name: 'Heat stroke' },
                { id: 'mbbs-fmt-56', name: 'Frostbite' },
                { id: 'mbbs-fmt-57', name: 'Electrocution & lightning' },
            ]},
            { id: 'mbbs-s7-sec9', name: 'Miscellaneous', topics: [
                { id: 'mbbs-fmt-58', name: 'Starvation' },
                { id: 'mbbs-fmt-59', name: 'Torture' },
                { id: 'mbbs-fmt-60', name: 'Human rights' },
                { id: 'mbbs-fmt-61', name: 'Custodial deaths' },
            ]},
            { id: 'mbbs-s7-sec10', name: 'TOXICOLOGY: General Toxicology', topics: [
                { id: 'mbbs-fmt-62', name: 'Definition of poison' },
                { id: 'mbbs-fmt-63', name: 'Ideal suicidal poison' },
                { id: 'mbbs-fmt-64', name: 'Routes of poisoning' },
                { id: 'mbbs-fmt-65', name: 'Treatment of poisoning (ABCDE approach)' },
                { id: 'mbbs-fmt-66', name: 'Gastric lavage' },
                { id: 'mbbs-fmt-67', name: 'Universal antidote' },
                { id: 'mbbs-fmt-68', name: 'Medicolegal aspects' },
            ]},
            { id: 'mbbs-s7-sec11', name: 'TOXICOLOGY: Corrosives', topics: [
                { id: 'mbbs-fmt-69', name: 'Acid poisoning (H2SO4, HCl, HNO3)' },
                { id: 'mbbs-fmt-70', name: 'Alkali poisoning' },
                { id: 'mbbs-fmt-71', name: 'Phenol' },
            ]},
            { id: 'mbbs-s7-sec12', name: 'TOXICOLOGY: Irritant Poisons', topics: [
                { id: 'mbbs-fmt-72', name: 'Arsenic' },
                { id: 'mbbs-fmt-73', name: 'Lead' },
                { id: 'mbbs-fmt-74', name: 'Mercury' },
                { id: 'mbbs-fmt-75', name: 'Copper' },
                { id: 'mbbs-fmt-76', name: 'Phosphorus' },
            ]},
            { id: 'mbbs-s7-sec13', name: 'TOXICOLOGY: Neurotoxic Poisons', topics: [
                { id: 'mbbs-fmt-77', name: 'Organophosphorus compounds' },
                { id: 'mbbs-fmt-78', name: 'Carbamates' },
                { id: 'mbbs-fmt-79', name: 'Organochlorines' },
                { id: 'mbbs-fmt-80', name: 'Snake bite' },
                { id: 'mbbs-fmt-81', name: 'Datura' },
                { id: 'mbbs-fmt-82', name: 'Cannabis' },
                { id: 'mbbs-fmt-83', name: 'Opioids' },
            ]},
            { id: 'mbbs-s7-sec14', name: 'TOXICOLOGY: Asphyxiant Poisons', topics: [
                { id: 'mbbs-fmt-84', name: 'Carbon monoxide' },
                { id: 'mbbs-fmt-85', name: 'Carbon dioxide' },
                { id: 'mbbs-fmt-86', name: 'Hydrogen sulphide' },
                { id: 'mbbs-fmt-87', name: 'Cyanide' },
            ]},
            { id: 'mbbs-s7-sec15', name: 'TOXICOLOGY: Cardiac & Miscellaneous Poisons', topics: [
                { id: 'mbbs-fmt-88', name: 'Oleander' },
                { id: 'mbbs-fmt-89', name: 'Digitalis' },
                { id: 'mbbs-fmt-90', name: 'Aconite' },
                { id: 'mbbs-fmt-91', name: 'Alcohol intoxication' },
                { id: 'mbbs-fmt-92', name: 'Methanol poisoning' },
                { id: 'mbbs-fmt-93', name: 'Barbiturates' },
                { id: 'mbbs-fmt-94', name: 'Benzodiazepines' },
            ]},
            { id: 'mbbs-s7-sec16', name: 'TOXICOLOGY: Drug Dependence & Abuse', topics: [
                { id: 'mbbs-fmt-95', name: 'Alcohol dependence' },
                { id: 'mbbs-fmt-96', name: 'Opioid dependence' },
                { id: 'mbbs-fmt-97', name: 'Cannabis' },
                { id: 'mbbs-fmt-98', name: 'Cocaine' },
                { id: 'mbbs-fmt-99', name: 'LSD' },
            ]},
            { id: 'mbbs-s7-sec17', name: 'Viva & Practical Important Areas', topics: [
                { id: 'mbbs-fmt-100', name: 'Postmortem instruments' },
                { id: 'mbbs-fmt-101', name: 'Poison identification charts' },
                { id: 'mbbs-fmt-102', name: 'Snake identification' },
                { id: 'mbbs-fmt-103', name: 'Bone identification' },
                { id: 'mbbs-fmt-104', name: 'Age estimation tables' },
                { id: 'mbbs-fmt-105', name: 'Injury description format' },
                { id: 'mbbs-fmt-106', name: 'Writing medicolegal reports' },
            ]},
        ]
    },
    {
        id: 'mbbs-s8', name: 'Community Medicine (PSM)',
        sections: [
            { id: 'mbbs-s8-sec1', name: 'Concept of Health & Disease', topics: [
                { id: 'mbbs-psm-1', name: 'Definition & dimensions of health' },
                { id: 'mbbs-psm-2', name: 'Natural history of disease' },
                { id: 'mbbs-psm-3', name: 'Levels of prevention' },
                { id: 'mbbs-psm-4', name: 'Iceberg phenomenon' },
                { id: 'mbbs-psm-5', name: 'Disease control vs elimination vs eradication' },
                { id: 'mbbs-psm-6', name: 'Epidemiological triad' },
            ]},
            { id: 'mbbs-s8-sec2', name: 'Epidemiology', topics: [
                { id: 'mbbs-psm-7', name: 'Measures of disease frequency (Incidence, Prevalence)' },
                { id: 'mbbs-psm-8', name: 'Rates, ratios, proportions' },
                { id: 'mbbs-psm-9', name: 'Types of epidemiological studies (case-control, cohort, RCT)' },
                { id: 'mbbs-psm-10', name: 'Bias, confounding' },
                { id: 'mbbs-psm-11', name: 'Screening tests (Sensitivity, Specificity, PPV, NPV)' },
                { id: 'mbbs-psm-12', name: 'Association & causation (Bradford Hill criteria)' },
                { id: 'mbbs-psm-13', name: 'Epidemic investigation steps' },
            ]},
            { id: 'mbbs-s8-sec3', name: 'Biostatistics', topics: [
                { id: 'mbbs-psm-14', name: 'Mean, Median, Mode' },
                { id: 'mbbs-psm-15', name: 'Standard deviation' },
                { id: 'mbbs-psm-16', name: 'Normal distribution' },
                { id: 'mbbs-psm-17', name: 'Sampling methods' },
                { id: 'mbbs-psm-18', name: 'Tests of significance (Chi-square, t-test)' },
                { id: 'mbbs-psm-19', name: 'p-value & confidence interval' },
            ]},
            { id: 'mbbs-s8-sec4', name: 'Demography & Family Planning', topics: [
                { id: 'mbbs-psm-20', name: 'Demographic cycle' },
                { id: 'mbbs-psm-21', name: 'Census & Sample Registration System' },
                { id: 'mbbs-psm-22', name: 'Fertility indicators' },
                { id: 'mbbs-psm-23', name: 'Population pyramid' },
                { id: 'mbbs-psm-24', name: 'Contraceptive methods (IUCD, OCPs, sterilization)' },
                { id: 'mbbs-psm-25', name: 'National Population Policy' },
            ]},
            { id: 'mbbs-s8-sec5', name: 'Communicable Diseases', topics: [
                { id: 'mbbs-psm-26', name: 'Tuberculosis' },
                { id: 'mbbs-psm-27', name: 'Epidemiology' },
                { id: 'mbbs-psm-28', name: 'Diagnosis' },
                { id: 'mbbs-psm-29', name: 'DOTS strategy under National Tuberculosis Elimination Programme' },
                { id: 'mbbs-psm-30', name: 'HIV/AIDS' },
                { id: 'mbbs-psm-31', name: 'Modes of transmission' },
                { id: 'mbbs-psm-32', name: 'Prevention' },
                { id: 'mbbs-psm-33', name: 'PPTCT' },
                { id: 'mbbs-psm-34', name: 'Malaria' },
                { id: 'mbbs-psm-35', name: 'Life cycle' },
                { id: 'mbbs-psm-36', name: 'National program under National Center for Vector Borne Diseases Control' },
                { id: 'mbbs-psm-37', name: 'Dengue, Chikungunya' },
                { id: 'mbbs-psm-38', name: 'Leprosy (NLEP)' },
                { id: 'mbbs-psm-39', name: 'Measles, Diphtheria, Polio' },
                { id: 'mbbs-psm-40', name: 'Surveillance under Integrated Disease Surveillance Programme' },
            ]},
            { id: 'mbbs-s8-sec6', name: 'Immunization', topics: [
                { id: 'mbbs-psm-41', name: 'Types of vaccines' },
                { id: 'mbbs-psm-42', name: 'Cold chain' },
                { id: 'mbbs-psm-43', name: 'National Immunization Schedule' },
                { id: 'mbbs-psm-44', name: 'Adverse events following immunization (AEFI)' },
                { id: 'mbbs-psm-45', name: 'Universal Immunization Programme' },
            ]},
            { id: 'mbbs-s8-sec7', name: 'National Health Programs (Very Important)', topics: [
                { id: 'mbbs-psm-46', name: 'National Health Mission' },
                { id: 'mbbs-psm-47', name: 'Revised National Tuberculosis Control Programme' },
                { id: 'mbbs-psm-48', name: 'National AIDS Control Organisation' },
                { id: 'mbbs-psm-49', name: 'National Programme for Prevention and Control of Cancer, Diabetes, Cardiovascular Diseases and Stroke' },
                { id: 'mbbs-psm-50', name: 'Ayushman Bharat' },
                { id: 'mbbs-psm-51', name: 'Janani Suraksha Yojana' },
            ]},
            { id: 'mbbs-s8-sec8', name: 'MCH (Maternal & Child Health)', topics: [
                { id: 'mbbs-psm-52', name: 'ANC care' },
                { id: 'mbbs-psm-53', name: 'High-risk pregnancy' },
                { id: 'mbbs-psm-54', name: 'IMR, MMR' },
                { id: 'mbbs-psm-55', name: 'Essential newborn care' },
                { id: 'mbbs-psm-56', name: 'Under-5 clinic' },
                { id: 'mbbs-psm-57', name: 'Growth charts' },
                { id: 'mbbs-psm-58', name: 'ORS & IMNCI' },
            ]},
            { id: 'mbbs-s8-sec9', name: 'Non-Communicable Diseases', topics: [
                { id: 'mbbs-psm-59', name: 'Hypertension' },
                { id: 'mbbs-psm-60', name: 'Diabetes' },
                { id: 'mbbs-psm-61', name: 'Obesity' },
                { id: 'mbbs-psm-62', name: 'Cancer screening' },
                { id: 'mbbs-psm-63', name: 'Risk factor approach' },
                { id: 'mbbs-psm-64', name: 'Prevention strategies' },
            ]},
            { id: 'mbbs-s8-sec10', name: 'Health Education & Communication', topics: [
                { id: 'mbbs-psm-65', name: 'Methods of health education' },
                { id: 'mbbs-psm-66', name: 'Communication process' },
                { id: 'mbbs-psm-67', name: 'Barriers' },
                { id: 'mbbs-psm-68', name: 'IEC & BCC' },
            ]},
            { id: 'mbbs-s8-sec11', name: 'Environmental Health', topics: [
                { id: 'mbbs-psm-69', name: 'Water purification methods' },
                { id: 'mbbs-psm-70', name: 'Air pollution' },
                { id: 'mbbs-psm-71', name: 'Waste disposal' },
                { id: 'mbbs-psm-72', name: 'Ventilation' },
                { id: 'mbbs-psm-73', name: 'Noise pollution' },
            ]},
            { id: 'mbbs-s8-sec12', name: 'Health Care Delivery System in India', topics: [
                { id: 'mbbs-psm-74', name: 'Primary Health Centre' },
                { id: 'mbbs-psm-75', name: 'Subcentre' },
                { id: 'mbbs-psm-76', name: 'Community Health Centre' },
                { id: 'mbbs-psm-77', name: 'Health team' },
                { id: 'mbbs-psm-78', name: 'ASHA worker role' },
            ]},
            { id: 'mbbs-s8-sec13', name: 'Occupational Health', topics: [
                { id: 'mbbs-psm-79', name: 'Pneumoconiosis' },
                { id: 'mbbs-psm-80', name: 'Lead poisoning' },
                { id: 'mbbs-psm-81', name: 'Occupational hazards' },
                { id: 'mbbs-psm-82', name: 'ESI Act' },
            ]},
            { id: 'mbbs-s8-sec14', name: 'International Health', topics: [
                { id: 'mbbs-psm-83', name: 'World Health Organization' },
                { id: 'mbbs-psm-84', name: 'SDGs' },
                { id: 'mbbs-psm-85', name: 'UNICEF' },
            ]},
            { id: 'mbbs-s8-sec15', name: 'Most Frequently Asked for Theory + Viva', topics: [
                { id: 'mbbs-psm-86', name: 'Screening tests' },
                { id: 'mbbs-psm-87', name: 'Epidemiological study designs' },
                { id: 'mbbs-psm-88', name: 'National health programs' },
                { id: 'mbbs-psm-89', name: 'IMR/MMR' },
                { id: 'mbbs-psm-90', name: 'Cold chain' },
                { id: 'mbbs-psm-91', name: 'DOTS' },
                { id: 'mbbs-psm-92', name: 'Contraception' },
                { id: 'mbbs-psm-93', name: 'Levels of prevention' },
            ]},
        ]
    },
    {
        id: 'mbbs-s9', name: 'Ophthalmology',
        sections: [
            { id: 'mbbs-s9-sec1', name: 'Anatomy of Eye', topics: [
                { id: 'mbbs-ophthal-1', name: 'Layers of eyeball' },
                { id: 'mbbs-ophthal-2', name: 'Aqueous humor formation & drainage' },
                { id: 'mbbs-ophthal-3', name: 'Retina – layers & blood supply' },
                { id: 'mbbs-ophthal-4', name: 'Extraocular muscles & nerve supply' },
                { id: 'mbbs-ophthal-5', name: 'Visual pathway & lesions' },
                { id: 'mbbs-ophthal-6', name: 'Applied anatomy of lacrimal apparatus' },
            ]},
            { id: 'mbbs-s9-sec2', name: 'Physiology of Vision', topics: [
                { id: 'mbbs-ophthal-7', name: 'Visual cycle' },
                { id: 'mbbs-ophthal-8', name: 'Dark & light adaptation' },
                { id: 'mbbs-ophthal-9', name: 'Color vision & color blindness' },
                { id: 'mbbs-ophthal-10', name: 'Pupillary reflexes' },
                { id: 'mbbs-ophthal-11', name: 'Accommodation' },
                { id: 'mbbs-ophthal-12', name: 'Intraocular pressure (IOP) regulation' },
            ]},
            { id: 'mbbs-s9-sec3', name: 'Clinical Methods in Ophthalmology', topics: [
                { id: 'mbbs-ophthal-13', name: 'Visual acuity testing (Snellen chart)' },
                { id: 'mbbs-ophthal-14', name: 'Refraction (myopia, hypermetropia, astigmatism)' },
                { id: 'mbbs-ophthal-15', name: 'Slit lamp examination' },
                { id: 'mbbs-ophthal-16', name: 'Tonometry' },
                { id: 'mbbs-ophthal-17', name: 'Perimetry' },
                { id: 'mbbs-ophthal-18', name: 'Fundoscopy' },
                { id: 'mbbs-ophthal-19', name: 'Fluorescein staining' },
            ]},
            { id: 'mbbs-s9-sec4', name: 'Disorders of Eyelid', topics: [
                { id: 'mbbs-ophthal-20', name: 'Blepharitis' },
                { id: 'mbbs-ophthal-21', name: 'Hordeolum (stye)' },
                { id: 'mbbs-ophthal-22', name: 'Chalazion' },
                { id: 'mbbs-ophthal-23', name: 'Ptosis' },
                { id: 'mbbs-ophthal-24', name: 'Entropion & ectropion' },
                { id: 'mbbs-ophthal-25', name: 'Lagophthalmos' },
            ]},
            { id: 'mbbs-s9-sec5', name: 'Conjunctiva', topics: [
                { id: 'mbbs-ophthal-26', name: 'Acute conjunctivitis (bacterial, viral, allergic)' },
                { id: 'mbbs-ophthal-27', name: 'Trachoma' },
                { id: 'mbbs-ophthal-28', name: 'Pterygium' },
                { id: 'mbbs-ophthal-29', name: 'Subconjunctival hemorrhage' },
            ]},
            { id: 'mbbs-s9-sec6', name: 'Cornea', topics: [
                { id: 'mbbs-ophthal-30', name: 'Corneal ulcer (bacterial, fungal, viral)' },
                { id: 'mbbs-ophthal-31', name: 'Keratitis' },
                { id: 'mbbs-ophthal-32', name: 'Herpes simplex keratitis' },
                { id: 'mbbs-ophthal-33', name: 'Corneal opacity' },
                { id: 'mbbs-ophthal-34', name: 'Keratoconus' },
            ]},
            { id: 'mbbs-s9-sec7', name: 'Sclera & Uveal Tract', topics: [
                { id: 'mbbs-ophthal-35', name: 'Episcleritis' },
                { id: 'mbbs-ophthal-36', name: 'Scleritis' },
                { id: 'mbbs-ophthal-37', name: 'Anterior uveitis (iritis, iridocyclitis)' },
                { id: 'mbbs-ophthal-38', name: 'Posterior uveitis' },
            ]},
            { id: 'mbbs-s9-sec8', name: 'Lens', topics: [
                { id: 'mbbs-ophthal-39', name: 'Cataract (types, stages, complications)' },
                { id: 'mbbs-ophthal-40', name: 'Congenital cataract' },
                { id: 'mbbs-ophthal-41', name: 'Surgical management (ECCE, SICS, phacoemulsification)' },
                { id: 'mbbs-ophthal-42', name: 'After-cataract' },
            ]},
            { id: 'mbbs-s9-sec9', name: 'Glaucoma (Very Important)', topics: [
                { id: 'mbbs-ophthal-43', name: 'Open angle glaucoma' },
                { id: 'mbbs-ophthal-44', name: 'Angle closure glaucoma' },
                { id: 'mbbs-ophthal-45', name: 'Congenital glaucoma' },
                { id: 'mbbs-ophthal-46', name: 'IOP changes' },
                { id: 'mbbs-ophthal-47', name: 'Visual field defects' },
                { id: 'mbbs-ophthal-48', name: 'Medical & surgical management' },
            ]},
            { id: 'mbbs-s9-sec10', name: 'Retina', topics: [
                { id: 'mbbs-ophthal-49', name: 'Diabetic retinopathy' },
                { id: 'mbbs-ophthal-50', name: 'Hypertensive retinopathy' },
                { id: 'mbbs-ophthal-51', name: 'Retinal detachment' },
                { id: 'mbbs-ophthal-52', name: 'Central retinal artery occlusion (CRAO)' },
                { id: 'mbbs-ophthal-53', name: 'Central retinal vein occlusion (CRVO)' },
                { id: 'mbbs-ophthal-54', name: 'Retinitis pigmentosa' },
                { id: 'mbbs-ophthal-55', name: 'Age related macular degeneration' },
            ]},
            { id: 'mbbs-s9-sec11', name: 'Optic Nerve', topics: [
                { id: 'mbbs-ophthal-56', name: 'Papilledema' },
                { id: 'mbbs-ophthal-57', name: 'Optic neuritis' },
                { id: 'mbbs-ophthal-58', name: 'Optic atrophy' },
                { id: 'mbbs-ophthal-59', name: 'Causes of disc edema' },
            ]},
            { id: 'mbbs-s9-sec12', name: 'Squint (Strabismus)', topics: [
                { id: 'mbbs-ophthal-60', name: 'Concomitant vs paralytic squint' },
                { id: 'mbbs-ophthal-61', name: 'Hirschberg test' },
                { id: 'mbbs-ophthal-62', name: 'Cover test' },
                { id: 'mbbs-ophthal-63', name: 'Amblyopia' },
            ]},
            { id: 'mbbs-s9-sec13', name: 'Ocular Trauma', topics: [
                { id: 'mbbs-ophthal-64', name: 'Blunt injury' },
                { id: 'mbbs-ophthal-65', name: 'Penetrating injury' },
                { id: 'mbbs-ophthal-66', name: 'Chemical injury (acid vs alkali – emergency management)' },
                { id: 'mbbs-ophthal-67', name: 'Foreign body' },
            ]},
            { id: 'mbbs-s9-sec14', name: 'Neuro-Ophthalmology', topics: [
                { id: 'mbbs-ophthal-68', name: 'Third, fourth, sixth nerve palsy' },
                { id: 'mbbs-ophthal-69', name: 'Visual field defects' },
                { id: 'mbbs-ophthal-70', name: 'Homonymous hemianopia' },
            ]},
            { id: 'mbbs-s9-sec15', name: 'Community Ophthalmology (Very Important for Viva)', topics: [
                { id: 'mbbs-ophthal-71', name: 'National Programme for Control of Blindness (NPCB)' },
                { id: 'mbbs-ophthal-72', name: 'Causes of preventable blindness in India' },
                { id: 'mbbs-ophthal-73', name: 'Vitamin A deficiency' },
                { id: 'mbbs-ophthal-74', name: 'Xerophthalmia' },
            ]},
            { id: 'mbbs-s9-sec16', name: 'Most Frequently Asked', topics: [
                { id: 'mbbs-ophthal-75', name: 'Cataract' },
                { id: 'mbbs-ophthal-76', name: 'Glaucoma' },
                { id: 'mbbs-ophthal-77', name: 'Corneal ulcer' },
                { id: 'mbbs-ophthal-78', name: 'Diabetic retinopathy' },
                { id: 'mbbs-ophthal-79', name: 'Uveitis' },
                { id: 'mbbs-ophthal-80', name: 'Squint' },
                { id: 'mbbs-ophthal-81', name: 'Chemical injury' },
            ]},
        ]
    },
    {
        id: 'mbbs-s10', name: 'ENT (Otorhinolaryngology)',
        sections: [
            { id: 'mbbs-s10-sec1', name: 'EAR: Anatomy & Physiology', topics: [
                { id: 'mbbs-ent-1', name: 'Anatomy of external, middle & inner ear' },
                { id: 'mbbs-ent-2', name: 'Ossicles & their functions' },
                { id: 'mbbs-ent-3', name: 'Organ of Corti' },
                { id: 'mbbs-ent-4', name: 'Eustachian tube functions' },
                { id: 'mbbs-ent-5', name: 'Mechanism of hearing' },
                { id: 'mbbs-ent-6', name: 'Vestibular apparatus & balance' },
            ]},
            { id: 'mbbs-s10-sec2', name: 'EAR: Clinical Methods', topics: [
                { id: 'mbbs-ent-7', name: 'Tuning fork tests (Rinne, Weber, ABC)' },
                { id: 'mbbs-ent-8', name: 'Pure tone audiometry' },
                { id: 'mbbs-ent-9', name: 'Impedance audiometry' },
                { id: 'mbbs-ent-10', name: 'BERA' },
                { id: 'mbbs-ent-11', name: 'Otoscopic findings' },
            ]},
            { id: 'mbbs-s10-sec3', name: 'EAR: Diseases of External Ear', topics: [
                { id: 'mbbs-ent-12', name: 'Wax (Impacted cerumen)' },
                { id: 'mbbs-ent-13', name: 'Otitis externa' },
                { id: 'mbbs-ent-14', name: 'Malignant otitis externa' },
                { id: 'mbbs-ent-15', name: 'Exostosis' },
                { id: 'mbbs-ent-16', name: 'Carcinoma pinna' },
            ]},
            { id: 'mbbs-s10-sec4', name: 'EAR: Diseases of Middle Ear', topics: [
                { id: 'mbbs-ent-17', name: 'Acute otitis media' },
                { id: 'mbbs-ent-18', name: 'CSOM (Tubotympanic & Atticoantral)' },
                { id: 'mbbs-ent-19', name: 'Complications of CSOM' },
                { id: 'mbbs-ent-20', name: 'Mastoiditis' },
                { id: 'mbbs-ent-21', name: 'Otosclerosis' },
                { id: 'mbbs-ent-22', name: 'Facial nerve palsy (LMN type)' },
            ]},
            { id: 'mbbs-s10-sec5', name: 'EAR: Inner Ear', topics: [
                { id: 'mbbs-ent-23', name: 'Ménière’s disease' },
                { id: 'mbbs-ent-24', name: 'Labyrinthitis' },
                { id: 'mbbs-ent-25', name: 'BPPV' },
                { id: 'mbbs-ent-26', name: 'Acoustic neuroma' },
                { id: 'mbbs-ent-27', name: 'Vertigo (causes & management)' },
            ]},
            { id: 'mbbs-s10-sec6', name: 'NOSE & PARANASAL SINUSES: Anatomy', topics: [
                { id: 'mbbs-ent-28', name: 'Osteomeatal complex' },
                { id: 'mbbs-ent-29', name: 'Lateral wall of nose' },
                { id: 'mbbs-ent-30', name: 'Blood supply (Little’s area)' },
            ]},
            { id: 'mbbs-s10-sec7', name: 'NOSE & PARANASAL SINUSES: Clinical Methods', topics: [
                { id: 'mbbs-ent-31', name: 'Anterior & posterior rhinoscopy' },
                { id: 'mbbs-ent-32', name: 'Diagnostic nasal endoscopy' },
            ]},
            { id: 'mbbs-s10-sec8', name: 'NOSE & PARANASAL SINUSES: Nasal Conditions', topics: [
                { id: 'mbbs-ent-33', name: 'DNS (Deviated nasal septum)' },
                { id: 'mbbs-ent-34', name: 'Epistaxis (causes & management)' },
                { id: 'mbbs-ent-35', name: 'Nasal polyp (Ethmoidal vs Antrochoanal)' },
                { id: 'mbbs-ent-36', name: 'Allergic rhinitis' },
                { id: 'mbbs-ent-37', name: 'Acute & chronic rhinitis' },
            ]},
            { id: 'mbbs-s10-sec9', name: 'NOSE & PARANASAL SINUSES: Sinus Diseases', topics: [
                { id: 'mbbs-ent-38', name: 'Acute sinusitis' },
                { id: 'mbbs-ent-39', name: 'Chronic sinusitis' },
                { id: 'mbbs-ent-40', name: 'Fungal sinusitis' },
                { id: 'mbbs-ent-41', name: 'Complications of sinusitis' },
                { id: 'mbbs-ent-42', name: 'Functional Endoscopic Sinus Surgery (FESS)' },
            ]},
            { id: 'mbbs-s10-sec10', name: 'NOSE & PARANASAL SINUSES: Tumors', topics: [
                { id: 'mbbs-ent-43', name: 'Juvenile nasopharyngeal angiofibroma' },
                { id: 'mbbs-ent-44', name: 'Carcinoma maxillary sinus' },
            ]},
            { id: 'mbbs-s10-sec11', name: 'ORAL CAVITY & OROPHARYNX', topics: [
                { id: 'mbbs-ent-45', name: 'Aphthous ulcer' },
                { id: 'mbbs-ent-46', name: 'Leukoplakia' },
                { id: 'mbbs-ent-47', name: 'Oral submucous fibrosis' },
                { id: 'mbbs-ent-48', name: 'Carcinoma tongue' },
                { id: 'mbbs-ent-49', name: 'Tonsillitis (Acute & Chronic)' },
                { id: 'mbbs-ent-50', name: 'Peritonsillar abscess (Quinsy)' },
                { id: 'mbbs-ent-51', name: 'Tonsillectomy indications & complications' },
                { id: 'mbbs-ent-52', name: 'Adenoid hypertrophy' },
            ]},
            { id: 'mbbs-s10-sec12', name: 'LARYNX: Anatomy', topics: [
                { id: 'mbbs-ent-53', name: 'Cartilages of larynx' },
                { id: 'mbbs-ent-54', name: 'Vocal cord movements' },
                { id: 'mbbs-ent-55', name: 'Nerve supply (Recurrent & Superior laryngeal nerve)' },
            ]},
            { id: 'mbbs-s10-sec13', name: 'LARYNX: Clinical Topics', topics: [
                { id: 'mbbs-ent-56', name: 'Hoarseness of voice (causes)' },
                { id: 'mbbs-ent-57', name: 'Acute epiglottitis' },
                { id: 'mbbs-ent-58', name: 'Laryngitis' },
                { id: 'mbbs-ent-59', name: 'Vocal cord paralysis' },
                { id: 'mbbs-ent-60', name: 'Benign vocal cord lesions (Nodules, Polyp)' },
                { id: 'mbbs-ent-61', name: 'Carcinoma larynx (Glottic vs Supraglottic)' },
                { id: 'mbbs-ent-62', name: 'Tracheostomy (Indications, steps, complications)' },
            ]},
            { id: 'mbbs-s10-sec14', name: 'NECK', topics: [
                { id: 'mbbs-ent-63', name: 'Branchial cyst' },
                { id: 'mbbs-ent-64', name: 'Thyroglossal cyst' },
                { id: 'mbbs-ent-65', name: 'Cervical lymphadenopathy' },
                { id: 'mbbs-ent-66', name: 'Deep neck space infections' },
                { id: 'mbbs-ent-67', name: 'Ludwig’s angina' },
            ]},
            { id: 'mbbs-s10-sec15', name: 'ENT EMERGENCIES', topics: [
                { id: 'mbbs-ent-68', name: 'Stridor (causes & management)' },
                { id: 'mbbs-ent-69', name: 'Foreign body ear, nose, bronchus' },
                { id: 'mbbs-ent-70', name: 'Epistaxis management' },
                { id: 'mbbs-ent-71', name: 'Anaphylaxis' },
                { id: 'mbbs-ent-72', name: 'Tracheostomy care' },
            ]},
            { id: 'mbbs-s10-sec16', name: 'Viva Topics', topics: [
                { id: 'mbbs-ent-73', name: 'Differences: CSOM types' },
                { id: 'mbbs-ent-74', name: 'Types of hearing loss' },
                { id: 'mbbs-ent-75', name: 'Indications for mastoidectomy' },
                { id: 'mbbs-ent-76', name: 'Indications for tonsillectomy' },
                { id: 'mbbs-ent-77', name: 'DNS complications' },
                { id: 'mbbs-ent-78', name: 'Vertigo causes table' },
                { id: 'mbbs-ent-79', name: 'Facial nerve course' },
            ]},
        ]
    },
    {
        id: 'mbbs-s11', name: 'General Medicine',
        sections: [
            { id: 'mbbs-s11-sec1', name: 'Cardiology', topics: [
                { id: 'mbbs-medicine-1', name: 'Heart failure (acute & chronic)' },
                { id: 'mbbs-medicine-2', name: 'Hypertension (JNC classification, emergency)' },
                { id: 'mbbs-medicine-3', name: 'Ischemic heart disease (Stable angina, ACS, MI)' },
                { id: 'mbbs-medicine-4', name: 'Rheumatic heart disease' },
                { id: 'mbbs-medicine-5', name: 'Valvular heart diseases (MS, MR, AS, AR)' },
                { id: 'mbbs-medicine-6', name: 'Cardiomyopathies' },
                { id: 'mbbs-medicine-7', name: 'Arrhythmias (AF, heart blocks)' },
                { id: 'mbbs-medicine-8', name: 'Infective endocarditis' },
                { id: 'mbbs-medicine-9', name: 'Pericardial effusion & tamponade' },
                { id: 'mbbs-medicine-10', name: 'ECG interpretation basics' },
            ]},
            { id: 'mbbs-s11-sec2', name: 'Respiratory Medicine', topics: [
                { id: 'mbbs-medicine-11', name: 'Bronchial asthma' },
                { id: 'mbbs-medicine-12', name: 'COPD' },
                { id: 'mbbs-medicine-13', name: 'Pneumonia (CAP, HAP)' },
                { id: 'mbbs-medicine-14', name: 'Tuberculosis (Pulmonary & Extra-pulmonary)' },
                { id: 'mbbs-medicine-15', name: 'Pleural effusion' },
                { id: 'mbbs-medicine-16', name: 'Pneumothorax' },
                { id: 'mbbs-medicine-17', name: 'Interstitial lung disease' },
                { id: 'mbbs-medicine-18', name: 'Lung cancer' },
                { id: 'mbbs-medicine-19', name: 'ARDS' },
            ]},
            { id: 'mbbs-s11-sec3', name: 'Neurology', topics: [
                { id: 'mbbs-medicine-20', name: 'Stroke (ischemic & hemorrhagic)' },
                { id: 'mbbs-medicine-21', name: 'Epilepsy & status epilepticus' },
                { id: 'mbbs-medicine-22', name: 'Meningitis & encephalitis' },
                { id: 'mbbs-medicine-23', name: 'Guillain-Barré syndrome' },
                { id: 'mbbs-medicine-24', name: 'Myasthenia gravis' },
                { id: 'mbbs-medicine-25', name: 'Parkinson’s disease' },
                { id: 'mbbs-medicine-26', name: 'Multiple sclerosis' },
                { id: 'mbbs-medicine-27', name: 'Peripheral neuropathy' },
                { id: 'mbbs-medicine-28', name: 'Coma approach' },
            ]},
            { id: 'mbbs-s11-sec4', name: 'Endocrinology', topics: [
                { id: 'mbbs-medicine-29', name: 'Diabetes mellitus (Type 1, Type 2)' },
                { id: 'mbbs-medicine-30', name: 'DKA & HHS' },
                { id: 'mbbs-medicine-31', name: 'Thyroid disorders (Hypo/Hyperthyroidism)' },
                { id: 'mbbs-medicine-32', name: 'Cushing’s syndrome' },
                { id: 'mbbs-medicine-33', name: 'Addison’s disease' },
                { id: 'mbbs-medicine-34', name: 'Hyperparathyroidism' },
                { id: 'mbbs-medicine-35', name: 'Metabolic syndrome' },
            ]},
            { id: 'mbbs-s11-sec5', name: 'Hematology', topics: [
                { id: 'mbbs-medicine-36', name: 'Anemia (Iron deficiency, Megaloblastic, Hemolytic, Aplastic)' },
                { id: 'mbbs-medicine-37', name: 'Leukemias (Acute & Chronic)' },
                { id: 'mbbs-medicine-38', name: 'Lymphomas' },
                { id: 'mbbs-medicine-39', name: 'Thrombocytopenia' },
                { id: 'mbbs-medicine-40', name: 'ITP' },
                { id: 'mbbs-medicine-41', name: 'Bleeding disorders' },
                { id: 'mbbs-medicine-42', name: 'DIC' },
            ]},
            { id: 'mbbs-s11-sec6', name: 'Infectious Diseases', topics: [
                { id: 'mbbs-medicine-43', name: 'Malaria' },
                { id: 'mbbs-medicine-44', name: 'Dengue' },
                { id: 'mbbs-medicine-45', name: 'Enteric fever' },
                { id: 'mbbs-medicine-46', name: 'HIV & opportunistic infections' },
                { id: 'mbbs-medicine-47', name: 'Leptospirosis' },
                { id: 'mbbs-medicine-48', name: 'Sepsis & septic shock' },
                { id: 'mbbs-medicine-49', name: 'Viral hepatitis' },
            ]},
            { id: 'mbbs-s11-sec7', name: 'Gastroenterology', topics: [
                { id: 'mbbs-medicine-50', name: 'GERD' },
                { id: 'mbbs-medicine-51', name: 'Peptic ulcer disease' },
                { id: 'mbbs-medicine-52', name: 'Acute & chronic pancreatitis' },
                { id: 'mbbs-medicine-53', name: 'Cirrhosis & portal hypertension' },
                { id: 'mbbs-medicine-54', name: 'Ascites' },
                { id: 'mbbs-medicine-55', name: 'Hepatic encephalopathy' },
                { id: 'mbbs-medicine-56', name: 'Jaundice approach' },
                { id: 'mbbs-medicine-57', name: 'Inflammatory bowel disease' },
            ]},
            { id: 'mbbs-s11-sec8', name: 'Nephrology', topics: [
                { id: 'mbbs-medicine-58', name: 'Acute kidney injury' },
                { id: 'mbbs-medicine-59', name: 'Chronic kidney disease' },
                { id: 'mbbs-medicine-60', name: 'Nephrotic syndrome' },
                { id: 'mbbs-medicine-61', name: 'Nephritic syndrome' },
                { id: 'mbbs-medicine-62', name: 'Glomerulonephritis' },
                { id: 'mbbs-medicine-63', name: 'Electrolyte imbalance' },
                { id: 'mbbs-medicine-64', name: 'Dialysis indications' },
            ]},
            { id: 'mbbs-s11-sec9', name: 'Rheumatology', topics: [
                { id: 'mbbs-medicine-65', name: 'Rheumatoid arthritis' },
                { id: 'mbbs-medicine-66', name: 'SLE' },
                { id: 'mbbs-medicine-67', name: 'Osteoarthritis' },
                { id: 'mbbs-medicine-68', name: 'Ankylosing spondylitis' },
                { id: 'mbbs-medicine-69', name: 'Gout' },
                { id: 'mbbs-medicine-70', name: 'Vasculitis' },
            ]},
            { id: 'mbbs-s11-sec10', name: 'Toxicology & Emergencies', topics: [
                { id: 'mbbs-medicine-71', name: 'Organophosphorus poisoning' },
                { id: 'mbbs-medicine-72', name: 'Snake bite' },
                { id: 'mbbs-medicine-73', name: 'Drug overdose' },
                { id: 'mbbs-medicine-74', name: 'Anaphylaxis' },
                { id: 'mbbs-medicine-75', name: 'Shock' },
                { id: 'mbbs-medicine-76', name: 'Acid–base disorders' },
                { id: 'mbbs-medicine-77', name: 'Poison management principles' },
            ]},
            { id: 'mbbs-s11-sec11', name: 'Clinical Skills', topics: [
                { id: 'mbbs-medicine-78', name: 'Case taking format (Long & short case)' },
                { id: 'mbbs-medicine-79', name: 'CVS, RS, CNS examination' },
                { id: 'mbbs-medicine-80', name: 'Fundoscopy basics' },
                { id: 'mbbs-medicine-81', name: 'ABG interpretation' },
                { id: 'mbbs-medicine-82', name: 'Chest X-ray reading' },
                { id: 'mbbs-medicine-83', name: 'ECG reading' },
                { id: 'mbbs-medicine-84', name: 'Fluid management' },
                { id: 'mbbs-medicine-85', name: 'Insulin regimen' },
            ]},
        ]
    },
    {
        id: 'mbbs-s12', name: 'Pediatrics',
        sections: [
            { id: 'mbbs-s12-sec1', name: 'Growth and Development', topics: [
                { id: 'mbbs-peds-1', name: 'Growth parameters (weight, height, head circumference charts)' },
                { id: 'mbbs-peds-2', name: 'Developmental milestones (motor, language, social)' },
                { id: 'mbbs-peds-3', name: 'Developmental delay & red flag signs' },
                { id: 'mbbs-peds-4', name: 'Tanner staging (puberty)' },
                { id: 'mbbs-peds-5', name: 'Short stature & failure to thrive' },
                { id: 'mbbs-peds-6', name: 'IAP growth charts' },
            ]},
            { id: 'mbbs-s12-sec2', name: 'Neonatology', topics: [
                { id: 'mbbs-peds-7', name: 'Neonatal resuscitation (NRP steps)' },
                { id: 'mbbs-peds-8', name: 'APGAR score' },
                { id: 'mbbs-peds-9', name: 'Low birth weight & prematurity' },
                { id: 'mbbs-peds-10', name: 'Neonatal jaundice (physiological vs pathological)' },
                { id: 'mbbs-peds-11', name: 'Neonatal sepsis' },
                { id: 'mbbs-peds-12', name: 'Hypoxic ischemic encephalopathy (HIE)' },
                { id: 'mbbs-peds-13', name: 'Respiratory distress syndrome (RDS)' },
                { id: 'mbbs-peds-14', name: 'Meconium aspiration syndrome' },
                { id: 'mbbs-peds-15', name: 'Neonatal hypoglycemia' },
                { id: 'mbbs-peds-16', name: 'Thermoregulation' },
                { id: 'mbbs-peds-17', name: 'Kangaroo mother care (KMC)' },
            ]},
            { id: 'mbbs-s12-sec3', name: 'Nutrition', topics: [
                { id: 'mbbs-peds-18', name: 'Breastfeeding (advantages & technique)' },
                { id: 'mbbs-peds-19', name: 'Complementary feeding' },
                { id: 'mbbs-peds-20', name: 'Protein energy malnutrition (PEM) – Marasmus, Kwashiorkor' },
                { id: 'mbbs-peds-21', name: 'Vitamin A deficiency' },
                { id: 'mbbs-peds-22', name: 'Rickets (Vitamin D deficiency)' },
                { id: 'mbbs-peds-23', name: 'Iron deficiency anemia' },
                { id: 'mbbs-peds-24', name: 'Severe acute malnutrition (SAM) management' },
            ]},
            { id: 'mbbs-s12-sec4', name: 'Immunization', topics: [
                { id: 'mbbs-peds-25', name: 'National Immunization Schedule (India)' },
                { id: 'mbbs-peds-26', name: 'IAP Immunization schedule' },
                { id: 'mbbs-peds-27', name: 'Cold chain' },
                { id: 'mbbs-peds-28', name: 'Adverse events following immunization (AEFI)' },
                { id: 'mbbs-peds-29', name: 'Vaccine types (live, killed, toxoid)' },
            ]},
            { id: 'mbbs-s12-sec5', name: 'Pediatric Infectious Diseases', topics: [
                { id: 'mbbs-peds-30', name: 'Acute gastroenteritis & ORS plan (A, B, C)' },
                { id: 'mbbs-peds-31', name: 'Pneumonia (WHO classification)' },
                { id: 'mbbs-peds-32', name: 'Tuberculosis in children' },
                { id: 'mbbs-peds-33', name: 'Measles' },
                { id: 'mbbs-peds-34', name: 'Diphtheria' },
                { id: 'mbbs-peds-35', name: 'Pertussis' },
                { id: 'mbbs-peds-36', name: 'Dengue' },
                { id: 'mbbs-peds-37', name: 'Malaria' },
                { id: 'mbbs-peds-38', name: 'Enteric fever' },
                { id: 'mbbs-peds-39', name: 'HIV in children' },
            ]},
            { id: 'mbbs-s12-sec6', name: 'Respiratory System', topics: [
                { id: 'mbbs-peds-40', name: 'Bronchiolitis' },
                { id: 'mbbs-peds-41', name: 'Asthma (acute attack management)' },
                { id: 'mbbs-peds-42', name: 'Cystic fibrosis' },
                { id: 'mbbs-peds-43', name: 'Foreign body aspiration' },
            ]},
            { id: 'mbbs-s12-sec7', name: 'Cardiovascular System', topics: [
                { id: 'mbbs-peds-44', name: 'Congenital heart diseases' },
                { id: 'mbbs-peds-45', name: 'VSD' },
                { id: 'mbbs-peds-46', name: 'ASD' },
                { id: 'mbbs-peds-47', name: 'PDA' },
                { id: 'mbbs-peds-48', name: 'Tetralogy of Fallot' },
                { id: 'mbbs-peds-49', name: 'Rheumatic fever' },
                { id: 'mbbs-peds-50', name: 'CCF in children' },
                { id: 'mbbs-peds-51', name: 'Cyanotic spells' },
            ]},
            { id: 'mbbs-s12-sec8', name: 'Gastrointestinal System', topics: [
                { id: 'mbbs-peds-52', name: 'Acute diarrhea' },
                { id: 'mbbs-peds-53', name: 'Celiac disease' },
                { id: 'mbbs-peds-54', name: 'Intussusception' },
                { id: 'mbbs-peds-55', name: 'Hirschsprung disease' },
                { id: 'mbbs-peds-56', name: 'Pyloric stenosis' },
                { id: 'mbbs-peds-57', name: 'Hepatitis in children' },
            ]},
            { id: 'mbbs-s12-sec9', name: 'Neurology', topics: [
                { id: 'mbbs-peds-58', name: 'Febrile seizures' },
                { id: 'mbbs-peds-59', name: 'Epilepsy' },
                { id: 'mbbs-peds-60', name: 'Meningitis' },
                { id: 'mbbs-peds-61', name: 'Cerebral palsy' },
                { id: 'mbbs-peds-62', name: 'Hydrocephalus' },
                { id: 'mbbs-peds-63', name: 'Neural tube defects' },
            ]},
            { id: 'mbbs-s12-sec10', name: 'Hematology', topics: [
                { id: 'mbbs-peds-64', name: 'Iron deficiency anemia' },
                { id: 'mbbs-peds-65', name: 'Thalassemia' },
                { id: 'mbbs-peds-66', name: 'Sickle cell anemia' },
                { id: 'mbbs-peds-67', name: 'ITP' },
                { id: 'mbbs-peds-68', name: 'Leukemia in children' },
                { id: 'mbbs-peds-69', name: 'Hemophilia' },
            ]},
            { id: 'mbbs-s12-sec11', name: 'Nephrology', topics: [
                { id: 'mbbs-peds-70', name: 'Nephrotic syndrome' },
                { id: 'mbbs-peds-71', name: 'Acute glomerulonephritis' },
                { id: 'mbbs-peds-72', name: 'UTI in children' },
                { id: 'mbbs-peds-73', name: 'Acute kidney injury' },
            ]},
            { id: 'mbbs-s12-sec12', name: 'Endocrinology', topics: [
                { id: 'mbbs-peds-74', name: 'Type 1 Diabetes Mellitus' },
                { id: 'mbbs-peds-75', name: 'Diabetic ketoacidosis (DKA)' },
                { id: 'mbbs-peds-76', name: 'Congenital hypothyroidism' },
                { id: 'mbbs-peds-77', name: 'Short stature causes' },
                { id: 'mbbs-peds-78', name: 'Precocious puberty' },
            ]},
            { id: 'mbbs-s12-sec13', name: 'Pediatric Emergencies', topics: [
                { id: 'mbbs-peds-79', name: 'Shock (types & management)' },
                { id: 'mbbs-peds-80', name: 'Dehydration management' },
                { id: 'mbbs-peds-81', name: 'Status epilepticus' },
                { id: 'mbbs-peds-82', name: 'Acute severe asthma' },
                { id: 'mbbs-peds-83', name: 'Anaphylaxis' },
                { id: 'mbbs-peds-84', name: 'Poisoning' },
            ]},
            { id: 'mbbs-s12-sec14', name: 'Genetics & Metabolic Disorders', topics: [
                { id: 'mbbs-peds-85', name: 'Down syndrome' },
                { id: 'mbbs-peds-86', name: 'Inborn errors of metabolism' },
                { id: 'mbbs-peds-87', name: 'Turner syndrome' },
            ]},
            { id: 'mbbs-s12-sec15', name: 'Social Pediatrics', topics: [
                { id: 'mbbs-peds-88', name: 'Child abuse' },
                { id: 'mbbs-peds-89', name: 'Adolescent health' },
                { id: 'mbbs-peds-90', name: 'IMNCI guidelines' },
                { id: 'mbbs-peds-91', name: 'Under-5 mortality causes' },
            ]},
        ]
    },
    {
        id: 'mbbs-s13', name: 'Dermatology',
        sections: [
            { id: 'mbbs-s13-sec1', name: 'Structure & Function of Skin', topics: [
                { id: 'mbbs-derm-1', name: 'Layers of skin & appendages' },
                { id: 'mbbs-derm-2', name: 'Functions of skin' },
                { id: 'mbbs-derm-3', name: 'Primary & secondary skin lesions' },
                { id: 'mbbs-derm-4', name: 'Basic dermatological terminology' },
            ]},
            { id: 'mbbs-s13-sec2', name: 'Bacterial Infections', topics: [
                { id: 'mbbs-derm-5', name: 'Impetigo' },
                { id: 'mbbs-derm-6', name: 'Erysipelas' },
                { id: 'mbbs-derm-7', name: 'Cellulitis' },
                { id: 'mbbs-derm-8', name: 'Furuncle & carbuncle' },
                { id: 'mbbs-derm-9', name: 'Cutaneous tuberculosis' },
                { id: 'mbbs-derm-10', name: 'Leprosy (Hansen’s disease) – classification, lepra reactions' },
            ]},
            { id: 'mbbs-s13-sec3', name: 'Viral Infections', topics: [
                { id: 'mbbs-derm-11', name: 'Herpes simplex' },
                { id: 'mbbs-derm-12', name: 'Herpes zoster' },
                { id: 'mbbs-derm-13', name: 'Molluscum contagiosum' },
                { id: 'mbbs-derm-14', name: 'Warts (HPV)' },
                { id: 'mbbs-derm-15', name: 'Measles, Rubella – skin manifestations' },
            ]},
            { id: 'mbbs-s13-sec4', name: 'Fungal Infections', topics: [
                { id: 'mbbs-derm-16', name: 'Dermatophytosis (Tinea corporis, capitis, pedis)' },
                { id: 'mbbs-derm-17', name: 'Candidiasis' },
                { id: 'mbbs-derm-18', name: 'Pityriasis versicolor' },
            ]},
            { id: 'mbbs-s13-sec5', name: 'Parasitic Infestations', topics: [
                { id: 'mbbs-derm-19', name: 'Scabies' },
                { id: 'mbbs-derm-20', name: 'Pediculosis' },
            ]},
            { id: 'mbbs-s13-sec6', name: 'Eczema & Dermatitis', topics: [
                { id: 'mbbs-derm-21', name: 'Atopic dermatitis' },
                { id: 'mbbs-derm-22', name: 'Contact dermatitis' },
                { id: 'mbbs-derm-23', name: 'Seborrheic dermatitis' },
                { id: 'mbbs-derm-24', name: 'Nummular eczema' },
                { id: 'mbbs-derm-25', name: 'Lichen simplex chronicus' },
            ]},
            { id: 'mbbs-s13-sec7', name: 'Papulosquamous Disorders', topics: [
                { id: 'mbbs-derm-26', name: 'Psoriasis' },
                { id: 'mbbs-derm-27', name: 'Lichen planus' },
                { id: 'mbbs-derm-28', name: 'Pityriasis rosea' },
            ]},
            { id: 'mbbs-s13-sec8', name: 'Vesiculobullous Disorders', topics: [
                { id: 'mbbs-derm-29', name: 'Pemphigus vulgaris' },
                { id: 'mbbs-derm-30', name: 'Bullous pemphigoid' },
                { id: 'mbbs-derm-31', name: 'Dermatitis herpetiformis' },
            ]},
            { id: 'mbbs-s13-sec9', name: 'Urticaria & Drug Reactions', topics: [
                { id: 'mbbs-derm-32', name: 'Urticaria' },
                { id: 'mbbs-derm-33', name: 'Angioedema' },
                { id: 'mbbs-derm-34', name: 'Stevens-Johnson syndrome' },
                { id: 'mbbs-derm-35', name: 'Toxic epidermal necrolysis' },
            ]},
            { id: 'mbbs-s13-sec10', name: 'Pigmentary Disorders', topics: [
                { id: 'mbbs-derm-36', name: 'Vitiligo' },
                { id: 'mbbs-derm-37', name: 'Melasma' },
                { id: 'mbbs-derm-38', name: 'Post-inflammatory hyperpigmentation' },
            ]},
            { id: 'mbbs-s13-sec11', name: 'Acne & Related Disorders', topics: [
                { id: 'mbbs-derm-39', name: 'Acne vulgaris' },
                { id: 'mbbs-derm-40', name: 'Rosacea' },
            ]},
            { id: 'mbbs-s13-sec12', name: 'Sexually Transmitted Infections (Dermato-Venereology)', topics: [
                { id: 'mbbs-derm-41', name: 'Syphilis' },
                { id: 'mbbs-derm-42', name: 'Gonorrhea' },
                { id: 'mbbs-derm-43', name: 'Chancroid' },
                { id: 'mbbs-derm-44', name: 'Lymphogranuloma venereum' },
                { id: 'mbbs-derm-45', name: 'HIV infection – cutaneous manifestations' },
            ]},
            { id: 'mbbs-s13-sec13', name: 'Hair & Nail Disorders', topics: [
                { id: 'mbbs-derm-46', name: 'Alopecia areata' },
                { id: 'mbbs-derm-47', name: 'Androgenetic alopecia' },
                { id: 'mbbs-derm-48', name: 'Onychomycosis' },
                { id: 'mbbs-derm-49', name: 'Nail psoriasis' },
            ]},
            { id: 'mbbs-s13-sec14', name: 'Skin Tumors', topics: [
                { id: 'mbbs-derm-50', name: 'Basal cell carcinoma' },
                { id: 'mbbs-derm-51', name: 'Squamous cell carcinoma' },
                { id: 'mbbs-derm-52', name: 'Malignant melanoma' },
                { id: 'mbbs-derm-53', name: 'Seborrheic keratosis' },
                { id: 'mbbs-derm-54', name: 'Nevi' },
            ]},
            { id: 'mbbs-s13-sec15', name: 'Miscellaneous Important Topics', topics: [
                { id: 'mbbs-derm-55', name: 'Erythema multiforme' },
                { id: 'mbbs-derm-56', name: 'Vasculitis' },
                { id: 'mbbs-derm-57', name: 'Cutaneous manifestations of systemic diseases' },
                { id: 'mbbs-derm-58', name: 'Genodermatoses (Neurofibromatosis)' },
            ]},
        ]
    },
    {
        id: 'mbbs-s14', name: 'Psychiatry',
        sections: [
            { id: 'mbbs-s14-sec1', name: 'Introduction & Classification', topics: [
                { id: 'mbbs-psych-1', name: 'Definition of mental health & mental illness' },
                { id: 'mbbs-psych-2', name: 'Bio-psycho-social model' },
                { id: 'mbbs-psych-3', name: 'ICD-10 / ICD-11 classification' },
                { id: 'mbbs-psych-4', name: 'Mental Status Examination (MSE)' },
                { id: 'mbbs-psych-5', name: 'Case history taking in psychiatry' },
            ]},
            { id: 'mbbs-s14-sec2', name: 'Schizophrenia & Other Psychotic Disorders', topics: [
                { id: 'mbbs-psych-6', name: 'Schizophrenia – types, symptoms (positive/negative), course' },
                { id: 'mbbs-psych-7', name: 'First rank symptoms (Schneider’s)' },
                { id: 'mbbs-psych-8', name: 'Delusional disorder' },
                { id: 'mbbs-psych-9', name: 'Brief psychotic disorder' },
                { id: 'mbbs-psych-10', name: 'Schizoaffective disorder' },
                { id: 'mbbs-psych-11', name: 'Management (antipsychotics – typical vs atypical)' },
                { id: 'mbbs-psych-12', name: 'Side effects: EPS, NMS, Tardive dyskinesia' },
            ]},
            { id: 'mbbs-s14-sec3', name: 'Mood Disorders', topics: [
                { id: 'mbbs-psych-13', name: 'Major Depressive Disorder – criteria, suicidal risk' },
                { id: 'mbbs-psych-14', name: 'Dysthymia' },
                { id: 'mbbs-psych-15', name: 'Bipolar Disorder – mania vs hypomania' },
                { id: 'mbbs-psych-16', name: 'Rapid cycling' },
                { id: 'mbbs-psych-17', name: 'Treatment: antidepressants, mood stabilizers (Lithium – toxicity), ECT indications' },
            ]},
            { id: 'mbbs-s14-sec4', name: 'Anxiety Disorders', topics: [
                { id: 'mbbs-psych-18', name: 'Generalized Anxiety Disorder' },
                { id: 'mbbs-psych-19', name: 'Panic disorder' },
                { id: 'mbbs-psych-20', name: 'Phobias (Agoraphobia, Social phobia)' },
                { id: 'mbbs-psych-21', name: 'OCD' },
                { id: 'mbbs-psych-22', name: 'PTSD' },
                { id: 'mbbs-psych-23', name: 'Drug treatment (SSRIs, Benzodiazepines)' },
            ]},
            { id: 'mbbs-s14-sec5', name: 'Substance Use Disorders', topics: [
                { id: 'mbbs-psych-24', name: 'Alcohol dependence – stages, withdrawal (Delirium tremens)' },
                { id: 'mbbs-psych-25', name: 'Opioid dependence' },
                { id: 'mbbs-psych-26', name: 'Cannabis, Cocaine' },
                { id: 'mbbs-psych-27', name: 'Management of withdrawal' },
                { id: 'mbbs-psych-28', name: 'De-addiction therapy' },
            ]},
            { id: 'mbbs-s14-sec6', name: 'Somatoform & Related Disorders', topics: [
                { id: 'mbbs-psych-29', name: 'Somatization disorder' },
                { id: 'mbbs-psych-30', name: 'Conversion disorder' },
                { id: 'mbbs-psych-31', name: 'Hypochondriasis' },
                { id: 'mbbs-psych-32', name: 'Dissociative disorders' },
            ]},
            { id: 'mbbs-s14-sec7', name: 'Child & Adolescent Psychiatry', topics: [
                { id: 'mbbs-psych-33', name: 'ADHD' },
                { id: 'mbbs-psych-34', name: 'Autism spectrum disorder' },
                { id: 'mbbs-psych-35', name: 'Conduct disorder' },
                { id: 'mbbs-psych-36', name: 'Intellectual disability' },
            ]},
            { id: 'mbbs-s14-sec8', name: 'Organic Mental Disorders', topics: [
                { id: 'mbbs-psych-37', name: 'Delirium' },
                { id: 'mbbs-psych-38', name: 'Dementia (Alzheimer’s)' },
                { id: 'mbbs-psych-39', name: 'Depression vs dementia differentiation' },
            ]},
            { id: 'mbbs-s14-sec9', name: 'Eating & Sleep Disorders', topics: [
                { id: 'mbbs-psych-40', name: 'Anorexia nervosa' },
                { id: 'mbbs-psych-41', name: 'Bulimia nervosa' },
                { id: 'mbbs-psych-42', name: 'Insomnia' },
                { id: 'mbbs-psych-43', name: 'Narcolepsy' },
            ]},
            { id: 'mbbs-s14-sec10', name: 'Psychopharmacology (Very Important for Viva)', topics: [
                { id: 'mbbs-psych-44', name: 'Antipsychotics (Typical vs Atypical)' },
                { id: 'mbbs-psych-45', name: 'Antidepressants (SSRIs, TCAs, MAO inhibitors)' },
                { id: 'mbbs-psych-46', name: 'Mood stabilizers (Lithium, Valproate)' },
                { id: 'mbbs-psych-47', name: 'Anxiolytics' },
                { id: 'mbbs-psych-48', name: 'Side effects & toxicity management' },
            ]},
            { id: 'mbbs-s14-sec11', name: 'Psychotherapy', topics: [
                { id: 'mbbs-psych-49', name: 'Cognitive Behavioral Therapy (CBT)' },
                { id: 'mbbs-psych-50', name: 'Behavior therapy' },
                { id: 'mbbs-psych-51', name: 'Psychoanalysis' },
                { id: 'mbbs-psych-52', name: 'Counseling techniques' },
            ]},
            { id: 'mbbs-s14-sec12', name: 'Forensic Psychiatry', topics: [
                { id: 'mbbs-psych-53', name: 'McNaughten rule' },
                { id: 'mbbs-psych-54', name: 'Criminal responsibility' },
                { id: 'mbbs-psych-55', name: 'Insanity defense' },
                { id: 'mbbs-psych-56', name: 'Testamentary capacity' },
                { id: 'mbbs-psych-57', name: 'Fitness to stand trial' },
            ]},
            { id: 'mbbs-s14-sec13', name: 'Psychiatric Emergencies', topics: [
                { id: 'mbbs-psych-58', name: 'Suicide risk assessment' },
                { id: 'mbbs-psych-59', name: 'Violent patient management' },
                { id: 'mbbs-psych-60', name: 'Acute psychosis' },
                { id: 'mbbs-psych-61', name: 'Drug overdose management' },
            ]},
            { id: 'mbbs-s14-sec14', name: 'Most Frequently Asked', topics: [
                { id: 'mbbs-psych-62', name: 'Schizophrenia' },
                { id: 'mbbs-psych-63', name: 'Depression & suicide' },
                { id: 'mbbs-psych-64', name: 'Bipolar disorder' },
                { id: 'mbbs-psych-65', name: 'Alcohol withdrawal' },
                { id: 'mbbs-psych-66', name: 'OCD' },
                { id: 'mbbs-psych-67', name: 'Lithium toxicity' },
                { id: 'mbbs-psych-68', name: 'Mental Status Examination' },
            ]},
        ]
    },
    {
        id: 'mbbs-s15', name: 'General Surgery',
        sections: [
            { id: 'mbbs-s15-sec1', name: 'Wound & Trauma', topics: [
                { id: 'mbbs-gensurg-1', name: 'Wound healing (phases, factors affecting)' },
                { id: 'mbbs-gensurg-2', name: 'Types of wounds' },
                { id: 'mbbs-gensurg-3', name: 'Shock (hypovolemic, septic, neurogenic)' },
                { id: 'mbbs-gensurg-4', name: 'ATLS protocol' },
                { id: 'mbbs-gensurg-5', name: 'Burns – Rule of 9, Parkland formula' },
                { id: 'mbbs-gensurg-6', name: 'Compartment syndrome' },
                { id: 'mbbs-gensurg-7', name: 'Crush injury' },
            ]},
            { id: 'mbbs-s15-sec2', name: 'Surgical Infections', topics: [
                { id: 'mbbs-gensurg-8', name: 'Cellulitis' },
                { id: 'mbbs-gensurg-9', name: 'Abscess (cold abscess)' },
                { id: 'mbbs-gensurg-10', name: 'Necrotizing fasciitis' },
                { id: 'mbbs-gensurg-11', name: 'Gas gangrene' },
                { id: 'mbbs-gensurg-12', name: 'Tetanus' },
                { id: 'mbbs-gensurg-13', name: 'Surgical site infection (SSI)' },
            ]},
            { id: 'mbbs-s15-sec3', name: 'Fluids, Blood & Transfusion', topics: [
                { id: 'mbbs-gensurg-14', name: 'Types of IV fluids' },
                { id: 'mbbs-gensurg-15', name: 'Fluid management in surgery' },
                { id: 'mbbs-gensurg-16', name: 'Electrolyte imbalance' },
                { id: 'mbbs-gensurg-17', name: 'Blood transfusion reactions' },
                { id: 'mbbs-gensurg-18', name: 'Massive transfusion protocol' },
            ]},
            { id: 'mbbs-s15-sec4', name: 'Thyroid & Parathyroid', topics: [
                { id: 'mbbs-gensurg-19', name: 'Solitary thyroid nodule' },
                { id: 'mbbs-gensurg-20', name: 'Multinodular goitre' },
                { id: 'mbbs-gensurg-21', name: 'Thyrotoxicosis' },
                { id: 'mbbs-gensurg-22', name: 'Thyroid carcinoma (papillary – most common)' },
                { id: 'mbbs-gensurg-23', name: 'Hyperparathyroidism' },
            ]},
            { id: 'mbbs-s15-sec5', name: 'Breast', topics: [
                { id: 'mbbs-gensurg-24', name: 'Fibroadenoma' },
                { id: 'mbbs-gensurg-25', name: 'Fibrocystic disease' },
                { id: 'mbbs-gensurg-26', name: 'Carcinoma breast (TNM staging, management)' },
                { id: 'mbbs-gensurg-27', name: 'Modified radical mastectomy' },
                { id: 'mbbs-gensurg-28', name: 'Sentinel lymph node biopsy' },
                { id: 'mbbs-gensurg-29', name: 'Breast abscess' },
            ]},
            { id: 'mbbs-s15-sec6', name: 'Gastrointestinal Tract', topics: [
                { id: 'mbbs-gensurg-30', name: 'Esophagus – GERD, Achalasia cardia, Carcinoma esophagus' },
                { id: 'mbbs-gensurg-31', name: 'Stomach - Peptic ulcer disease, Complications of PUD (perforation), Carcinoma stomach' },
                { id: 'mbbs-gensurg-32', name: 'Small Intestine - Intestinal obstruction, Meckel’s diverticulum, Crohn’s disease' },
                { id: 'mbbs-gensurg-33', name: 'Appendix - Acute appendicitis (most common long case)' },
                { id: 'mbbs-gensurg-34', name: 'Colon & Rectum - Ulcerative colitis, Colorectal carcinoma, Hemorrhoids, Fissure in ano, Fistula in ano' },
            ]},
            { id: 'mbbs-s15-sec7', name: 'Hepatobiliary System', topics: [
                { id: 'mbbs-gensurg-35', name: 'Gallstones (cholelithiasis)' },
                { id: 'mbbs-gensurg-36', name: 'Acute & chronic cholecystitis' },
                { id: 'mbbs-gensurg-37', name: 'Obstructive jaundice' },
                { id: 'mbbs-gensurg-38', name: 'Carcinoma gallbladder' },
                { id: 'mbbs-gensurg-39', name: 'Liver abscess' },
                { id: 'mbbs-gensurg-40', name: 'Portal hypertension' },
                { id: 'mbbs-gensurg-41', name: 'Hepatocellular carcinoma' },
            ]},
            { id: 'mbbs-s15-sec8', name: 'Pancreas', topics: [
                { id: 'mbbs-gensurg-42', name: 'Acute pancreatitis' },
                { id: 'mbbs-gensurg-43', name: 'Chronic pancreatitis' },
                { id: 'mbbs-gensurg-44', name: 'Carcinoma pancreas' },
            ]},
            { id: 'mbbs-s15-sec9', name: 'Hernia', topics: [
                { id: 'mbbs-gensurg-45', name: 'Inguinal hernia (most important)' },
                { id: 'mbbs-gensurg-46', name: 'Femoral hernia' },
                { id: 'mbbs-gensurg-47', name: 'Umbilical hernia' },
                { id: 'mbbs-gensurg-48', name: 'Incisional hernia' },
                { id: 'mbbs-gensurg-49', name: 'Complications of hernia' },
            ]},
            { id: 'mbbs-s15-sec10', name: 'Urology', topics: [
                { id: 'mbbs-gensurg-50', name: 'Renal calculi' },
                { id: 'mbbs-gensurg-51', name: 'Hydronephrosis' },
                { id: 'mbbs-gensurg-52', name: 'Carcinoma kidney' },
                { id: 'mbbs-gensurg-53', name: 'BPH (very important)' },
                { id: 'mbbs-gensurg-54', name: 'Carcinoma prostate' },
                { id: 'mbbs-gensurg-55', name: 'Torsion testis' },
                { id: 'mbbs-gensurg-56', name: 'Undescended testis' },
                { id: 'mbbs-gensurg-57', name: 'Hydrocele' },
            ]},
            { id: 'mbbs-s15-sec11', name: 'Neurosurgery Basics', topics: [
                { id: 'mbbs-gensurg-58', name: 'Head injury' },
                { id: 'mbbs-gensurg-59', name: 'Extradural hematoma' },
                { id: 'mbbs-gensurg-60', name: 'Subdural hematoma' },
                { id: 'mbbs-gensurg-61', name: 'Raised intracranial pressure' },
            ]},
            { id: 'mbbs-s15-sec12', name: 'Vascular Surgery', topics: [
                { id: 'mbbs-gensurg-62', name: 'Varicose veins' },
                { id: 'mbbs-gensurg-63', name: 'DVT' },
                { id: 'mbbs-gensurg-64', name: 'Peripheral arterial disease' },
                { id: 'mbbs-gensurg-65', name: 'Aneurysm' },
            ]},
        ]
    },
    {
        id: 'mbbs-s16', name: 'Orthopedics',
        sections: [
            { id: 'mbbs-s16-sec1', name: 'General Orthopaedics', topics: [
                { id: 'mbbs-ortho-1', name: 'Fracture – definition, types, healing stages' },
                { id: 'mbbs-ortho-2', name: 'Complications of fractures (early & late)' },
                { id: 'mbbs-ortho-3', name: 'Non-union vs delayed union' },
                { id: 'mbbs-ortho-4', name: 'Malunion' },
                { id: 'mbbs-ortho-5', name: 'Open fractures – Gustilo classification' },
                { id: 'mbbs-ortho-6', name: 'Principles of fracture management' },
                { id: 'mbbs-ortho-7', name: 'Internal fixation vs external fixation' },
                { id: 'mbbs-ortho-8', name: 'Bone grafts – types & indications' },
                { id: 'mbbs-ortho-9', name: 'Traction – types & indications' },
                { id: 'mbbs-ortho-10', name: 'Splints and casts – complications' },
            ]},
            { id: 'mbbs-s16-sec2', name: 'Bone Infections', topics: [
                { id: 'mbbs-ortho-11', name: 'Acute osteomyelitis' },
                { id: 'mbbs-ortho-12', name: 'Chronic osteomyelitis' },
                { id: 'mbbs-ortho-13', name: 'Brodie’s abscess' },
                { id: 'mbbs-ortho-14', name: 'Tuberculosis of bone' },
                { id: 'mbbs-ortho-15', name: 'TB spine (Pott’s spine)' },
                { id: 'mbbs-ortho-16', name: 'Septic arthritis' },
                { id: 'mbbs-ortho-17', name: 'Differentiation: TB vs pyogenic infection' },
            ]},
            { id: 'mbbs-s16-sec3', name: 'Metabolic Bone Disorders', topics: [
                { id: 'mbbs-ortho-18', name: 'Rickets' },
                { id: 'mbbs-ortho-19', name: 'Osteomalacia' },
                { id: 'mbbs-ortho-20', name: 'Osteoporosis' },
                { id: 'mbbs-ortho-21', name: 'Paget’s disease' },
                { id: 'mbbs-ortho-22', name: 'Hyperparathyroidism – skeletal changes' },
            ]},
            { id: 'mbbs-s16-sec4', name: 'Bone Tumors', topics: [
                { id: 'mbbs-ortho-23', name: 'Classification of bone tumors' },
                { id: 'mbbs-ortho-24', name: 'Osteosarcoma' },
                { id: 'mbbs-ortho-25', name: 'Ewing’s sarcoma' },
                { id: 'mbbs-ortho-26', name: 'Giant cell tumor' },
                { id: 'mbbs-ortho-27', name: 'Osteochondroma' },
                { id: 'mbbs-ortho-28', name: 'Chondrosarcoma' },
                { id: 'mbbs-ortho-29', name: 'Metastatic bone disease' },
                { id: 'mbbs-ortho-30', name: 'X-ray features of bone tumors' },
            ]},
            { id: 'mbbs-s16-sec5', name: 'Pediatric Orthopaedics', topics: [
                { id: 'mbbs-ortho-31', name: 'Developmental dysplasia of hip (DDH)' },
                { id: 'mbbs-ortho-32', name: 'Congenital talipes equinovarus (CTEV)' },
                { id: 'mbbs-ortho-33', name: 'Perthes disease' },
                { id: 'mbbs-ortho-34', name: 'Slipped capital femoral epiphysis (SCFE)' },
                { id: 'mbbs-ortho-35', name: 'Cerebral palsy deformities' },
                { id: 'mbbs-ortho-36', name: 'Rickets deformities' },
            ]},
            { id: 'mbbs-s16-sec6', name: 'Spine Disorders', topics: [
                { id: 'mbbs-ortho-37', name: 'Prolapsed intervertebral disc (PIVD)' },
                { id: 'mbbs-ortho-38', name: 'Lumbar disc herniation' },
                { id: 'mbbs-ortho-39', name: 'Spondylolisthesis' },
                { id: 'mbbs-ortho-40', name: 'Scoliosis' },
                { id: 'mbbs-ortho-41', name: 'Kyphosis' },
                { id: 'mbbs-ortho-42', name: 'Ankylosing spondylitis' },
                { id: 'mbbs-ortho-43', name: 'TB spine' },
                { id: 'mbbs-ortho-44', name: 'Cauda equina syndrome' },
            ]},
            { id: 'mbbs-s16-sec7', name: 'Joint Disorders', topics: [
                { id: 'mbbs-ortho-45', name: 'Osteoarthritis' },
                { id: 'mbbs-ortho-46', name: 'Rheumatoid arthritis' },
                { id: 'mbbs-ortho-47', name: 'Gout' },
                { id: 'mbbs-ortho-48', name: 'Hemophilic arthritis' },
                { id: 'mbbs-ortho-49', name: 'Avascular necrosis of femoral head' },
                { id: 'mbbs-ortho-50', name: 'Meniscal injury' },
                { id: 'mbbs-ortho-51', name: 'Ligament injuries (ACL, PCL)' },
            ]},
            { id: 'mbbs-s16-sec8', name: 'Upper Limb Injuries', topics: [
                { id: 'mbbs-ortho-52', name: 'Fracture clavicle' },
                { id: 'mbbs-ortho-53', name: 'Surgical neck humerus fracture' },
                { id: 'mbbs-ortho-54', name: 'Supracondylar fracture humerus' },
                { id: 'mbbs-ortho-55', name: 'Colles fracture' },
                { id: 'mbbs-ortho-56', name: 'Monteggia & Galeazzi fracture' },
                { id: 'mbbs-ortho-57', name: 'Shoulder dislocation' },
                { id: 'mbbs-ortho-58', name: 'Radial nerve injury' },
                { id: 'mbbs-ortho-59', name: 'Wrist drop' },
            ]},
            { id: 'mbbs-s16-sec9', name: 'Lower Limb Injuries', topics: [
                { id: 'mbbs-ortho-60', name: 'Fracture neck of femur' },
                { id: 'mbbs-ortho-61', name: 'Intertrochanteric fracture' },
                { id: 'mbbs-ortho-62', name: 'Shaft femur fracture' },
                { id: 'mbbs-ortho-63', name: 'Patella fracture' },
                { id: 'mbbs-ortho-64', name: 'Tibia shaft fracture' },
                { id: 'mbbs-ortho-65', name: 'Pott’s fracture' },
                { id: 'mbbs-ortho-66', name: 'Ankle sprain' },
                { id: 'mbbs-ortho-67', name: 'Hip dislocation' },
            ]},
            { id: 'mbbs-s16-sec10', name: 'Orthopaedic Emergencies', topics: [
                { id: 'mbbs-ortho-68', name: 'Compartment syndrome' },
                { id: 'mbbs-ortho-69', name: 'Fat embolism' },
                { id: 'mbbs-ortho-70', name: 'Crush injury' },
                { id: 'mbbs-ortho-71', name: 'Gas gangrene' },
                { id: 'mbbs-ortho-72', name: 'Septic arthritis' },
                { id: 'mbbs-ortho-73', name: 'Open fracture management' },
                { id: 'mbbs-ortho-74', name: 'Cauda equina syndrome' },
            ]},
            { id: 'mbbs-s16-sec11', name: 'Nerve Injuries', topics: [
                { id: 'mbbs-ortho-75', name: 'Radial nerve palsy' },
                { id: 'mbbs-ortho-76', name: 'Ulnar nerve palsy' },
                { id: 'mbbs-ortho-77', name: 'Median nerve palsy' },
                { id: 'mbbs-ortho-78', name: 'Erb’s palsy' },
                { id: 'mbbs-ortho-79', name: 'Klumpke’s palsy' },
                { id: 'mbbs-ortho-80', name: 'Foot drop' },
            ]},
            { id: 'mbbs-s16-sec12', name: 'Deformities', topics: [
                { id: 'mbbs-ortho-81', name: 'Genu valgum' },
                { id: 'mbbs-ortho-82', name: 'Genu varum' },
                { id: 'mbbs-ortho-83', name: 'Flat foot' },
                { id: 'mbbs-ortho-84', name: 'Hallux valgus' },
                { id: 'mbbs-ortho-85', name: 'Contractures' },
                { id: 'mbbs-ortho-86', name: 'Volkmann’s ischemic contracture' },
            ]},
        ]
    },
    {
        id: 'mbbs-s17', name: 'Obstetrics & Gynaecology (OBG)',
        sections: [
            { id: 'mbbs-s17-sec1', name: 'OBSTRETICS: Basic Concepts & Physiology of Pregnancy', topics: [
                { id: 'mbbs-obg-1', name: 'Maternal physiological changes in pregnancy (CVS, RS, renal, hematological)' },
                { id: 'mbbs-obg-2', name: 'Hormones in pregnancy (hCG, hPL, progesterone, estrogen)' },
                { id: 'mbbs-obg-3', name: 'Diagnosis of pregnancy' },
                { id: 'mbbs-obg-4', name: 'Antenatal care (ANC protocol)' },
                { id: 'mbbs-obg-5', name: 'Calculation of EDD (Naegele’s rule)' },
            ]},
            { id: 'mbbs-s17-sec2', name: 'OBSTRETICS: Early Pregnancy & Complications', topics: [
                { id: 'mbbs-obg-6', name: 'Types of abortion (threatened, inevitable, missed, incomplete, septic)' },
                { id: 'mbbs-obg-7', name: 'Recurrent pregnancy loss' },
                { id: 'mbbs-obg-8', name: 'Ectopic pregnancy' },
                { id: 'mbbs-obg-9', name: 'Gestational trophoblastic disease (Hydatidiform mole, choriocarcinoma)' },
                { id: 'mbbs-obg-10', name: 'Hyperemesis gravidarum' },
            ]},
            { id: 'mbbs-s17-sec3', name: 'OBSTRETICS: Antenatal Care & High-Risk Pregnancy', topics: [
                { id: 'mbbs-obg-11', name: 'Routine antenatal investigations' },
                { id: 'mbbs-obg-12', name: 'Anemia in pregnancy' },
                { id: 'mbbs-obg-13', name: 'Gestational diabetes mellitus (GDM)' },
                { id: 'mbbs-obg-14', name: 'Rh incompatibility' },
                { id: 'mbbs-obg-15', name: 'TORCH infections' },
                { id: 'mbbs-obg-16', name: 'Teenage & elderly pregnancy' },
            ]},
            { id: 'mbbs-s17-sec4', name: 'OBSTRETICS: Hypertensive Disorders in Pregnancy', topics: [
                { id: 'mbbs-obg-17', name: 'Gestational hypertension' },
                { id: 'mbbs-obg-18', name: 'Preeclampsia (mild/severe)' },
                { id: 'mbbs-obg-19', name: 'Eclampsia' },
                { id: 'mbbs-obg-20', name: 'HELLP syndrome' },
                { id: 'mbbs-obg-21', name: 'Management including MgSO₄ regimen (Pritchard regimen)' },
            ]},
            { id: 'mbbs-s17-sec5', name: 'OBSTRETICS: Antepartum Hemorrhage (APH)', topics: [
                { id: 'mbbs-obg-22', name: 'Placenta previa' },
                { id: 'mbbs-obg-23', name: 'Abruptio placentae' },
                { id: 'mbbs-obg-24', name: 'Vasa previa' },
                { id: 'mbbs-obg-25', name: 'Management protocols' },
            ]},
            { id: 'mbbs-s17-sec6', name: 'OBSTRETICS: Intrauterine Growth & Fetal Well-Being', topics: [
                { id: 'mbbs-obg-26', name: 'IUGR vs SGA' },
                { id: 'mbbs-obg-27', name: 'Polyhydramnios & oligohydramnios' },
                { id: 'mbbs-obg-28', name: 'Fetal surveillance (NST, BPP, Doppler)' },
                { id: 'mbbs-obg-29', name: 'Kick count method' },
            ]},
            { id: 'mbbs-s17-sec7', name: 'OBSTRETICS: Preterm & Post-Term Pregnancy', topics: [
                { id: 'mbbs-obg-30', name: 'Preterm labor (causes & management)' },
                { id: 'mbbs-obg-31', name: 'PROM & PPROM' },
                { id: 'mbbs-obg-32', name: 'Use of corticosteroids' },
                { id: 'mbbs-obg-33', name: 'Post-dated pregnancy' },
            ]},
            { id: 'mbbs-s17-sec8', name: 'OBSTRETICS: Normal Labour', topics: [
                { id: 'mbbs-obg-34', name: 'Stages of labour' },
                { id: 'mbbs-obg-35', name: 'Mechanism of normal labour (cardinal movements)' },
                { id: 'mbbs-obg-36', name: 'Partograph' },
                { id: 'mbbs-obg-37', name: 'Active management of third stage of labour (AMTSL)' },
            ]},
            { id: 'mbbs-s17-sec9', name: 'OBSTRETICS: Abnormal Labour', topics: [
                { id: 'mbbs-obg-38', name: 'Prolonged labour' },
                { id: 'mbbs-obg-39', name: 'Obstructed labour' },
                { id: 'mbbs-obg-40', name: 'CPD (Cephalopelvic disproportion)' },
                { id: 'mbbs-obg-41', name: 'Malpresentations:' },
                { id: 'mbbs-obg-42', name: 'Breech' },
                { id: 'mbbs-obg-43', name: 'Face & brow' },
                { id: 'mbbs-obg-44', name: 'Shoulder presentation' },
                { id: 'mbbs-obg-45', name: 'Induction of labour (Bishop score)' },
            ]},
            { id: 'mbbs-s17-sec10', name: 'OBSTRETICS: Instrumental & Operative Delivery', topics: [
                { id: 'mbbs-obg-46', name: 'Forceps delivery' },
                { id: 'mbbs-obg-47', name: 'Vacuum delivery' },
                { id: 'mbbs-obg-48', name: 'Cesarean section (indications, complications)' },
                { id: 'mbbs-obg-49', name: 'VBAC' },
            ]},
            { id: 'mbbs-s17-sec11', name: 'OBSTRETICS: Postpartum Hemorrhage (PPH)', topics: [
                { id: 'mbbs-obg-50', name: 'Atonic PPH' },
                { id: 'mbbs-obg-51', name: 'Traumatic PPH' },
                { id: 'mbbs-obg-52', name: 'Management (uterotonics, balloon tamponade)' },
                { id: 'mbbs-obg-53', name: 'B-Lynch suture' },
            ]},
            { id: 'mbbs-s17-sec12', name: 'OBSTRETICS: Puerperium', topics: [
                { id: 'mbbs-obg-54', name: 'Normal puerperium' },
                { id: 'mbbs-obg-55', name: 'Puerperal sepsis' },
                { id: 'mbbs-obg-56', name: 'Mastitis & breast abscess' },
                { id: 'mbbs-obg-57', name: 'Subinvolution' },
            ]},
            { id: 'mbbs-s17-sec13', name: 'OBSTRETICS: Medical Disorders in Pregnancy', topics: [
                { id: 'mbbs-obg-58', name: 'Heart disease in pregnancy' },
                { id: 'mbbs-obg-59', name: 'Diabetes in pregnancy' },
                { id: 'mbbs-obg-60', name: 'Thyroid disorders' },
                { id: 'mbbs-obg-61', name: 'Epilepsy' },
                { id: 'mbbs-obg-62', name: 'Asthma' },
                { id: 'mbbs-obg-63', name: 'HIV in pregnancy' },
            ]},
            { id: 'mbbs-s17-sec14', name: 'OBSTRETICS: Multiple Pregnancy', topics: [
                { id: 'mbbs-obg-64', name: 'Twin pregnancy (MCDA vs DCDA)' },
                { id: 'mbbs-obg-65', name: 'Twin-to-twin transfusion syndrome' },
                { id: 'mbbs-obg-66', name: 'Complications' },
            ]},
            { id: 'mbbs-s17-sec15', name: 'OBSTRETICS: Obstetric Emergencies', topics: [
                { id: 'mbbs-obg-67', name: 'Uterine rupture' },
                { id: 'mbbs-obg-68', name: 'Amniotic fluid embolism' },
                { id: 'mbbs-obg-69', name: 'Cord prolapse' },
                { id: 'mbbs-obg-70', name: 'Shoulder dystocia (McRoberts maneuver)' },
            ]},
            { id: 'mbbs-s17-sec16', name: 'OBSTRETICS: Contraception & Family Planning', topics: [
                { id: 'mbbs-obg-71', name: 'Postpartum contraception' },
                { id: 'mbbs-obg-72', name: 'IUCD (Copper-T)' },
                { id: 'mbbs-obg-73', name: 'OCPs' },
                { id: 'mbbs-obg-74', name: 'Emergency contraception' },
                { id: 'mbbs-obg-75', name: 'Sterilization (Tubectomy)' },
            ]},
            { id: 'mbbs-s17-sec17', name: 'GYNAECOLOGY: Applied Anatomy & Physiology', topics: [
                { id: 'mbbs-obg-76', name: 'Developmental anomalies of female genital tract' },
                { id: 'mbbs-obg-77', name: 'Menstrual cycle (hormonal regulation)' },
                { id: 'mbbs-obg-78', name: 'Puberty & its disorders' },
                { id: 'mbbs-obg-79', name: 'Menopause & HRT' },
            ]},
            { id: 'mbbs-s17-sec18', name: 'GYNAECOLOGY: Disorders of Menstruation', topics: [
                { id: 'mbbs-obg-80', name: 'Amenorrhea (Primary & Secondary) – causes, evaluation, management' },
                { id: 'mbbs-obg-81', name: 'Dysmenorrhea' },
                { id: 'mbbs-obg-82', name: 'Abnormal Uterine Bleeding (AUB) – PALM-COEIN classification' },
                { id: 'mbbs-obg-83', name: 'Dysfunctional Uterine Bleeding (DUB)' },
                { id: 'mbbs-obg-84', name: 'Premenstrual Syndrome (PMS)' },
            ]},
            { id: 'mbbs-s17-sec19', name: 'GYNAECOLOGY: Puberty & Adolescence', topics: [
                { id: 'mbbs-obg-85', name: 'Precocious puberty' },
                { id: 'mbbs-obg-86', name: 'Delayed puberty' },
                { id: 'mbbs-obg-87', name: 'Teenage pregnancy issues' },
            ]},
            { id: 'mbbs-s17-sec20', name: 'GYNAECOLOGY: Pelvic Infections', topics: [
                { id: 'mbbs-obg-88', name: 'Pelvic Inflammatory Disease (PID)' },
                { id: 'mbbs-obg-89', name: 'Tubo-ovarian abscess' },
                { id: 'mbbs-obg-90', name: 'Genital tuberculosis (very important in India)' },
                { id: 'mbbs-obg-91', name: 'STIs (clinical features & management)' },
            ]},
            { id: 'mbbs-s17-sec21', name: 'GYNAECOLOGY: Benign Disorders of Uterus', topics: [
                { id: 'mbbs-obg-92', name: 'Fibroid uterus (Leiomyoma)' },
                { id: 'mbbs-obg-93', name: 'Adenomyosis' },
                { id: 'mbbs-obg-94', name: 'Endometrial hyperplasia' },
                { id: 'mbbs-obg-95', name: 'Endometriosis' },
            ]},
            { id: 'mbbs-s17-sec22', name: 'GYNAECOLOGY: Ovarian Tumors', topics: [
                { id: 'mbbs-obg-96', name: 'Classification of ovarian tumors' },
                { id: 'mbbs-obg-97', name: 'Benign ovarian cysts' },
                { id: 'mbbs-obg-98', name: 'Dermoid cyst' },
                { id: 'mbbs-obg-99', name: 'Malignant ovarian tumor – staging & management' },
                { id: 'mbbs-obg-100', name: 'Tumor markers (CA-125 etc.)' },
            ]},
            { id: 'mbbs-s17-sec23', name: 'GYNAECOLOGY: Pelvic Organ Prolapse', topics: [
                { id: 'mbbs-obg-101', name: 'Uterine prolapse – degrees' },
                { id: 'mbbs-obg-102', name: 'Cystocele & Rectocele' },
                { id: 'mbbs-obg-103', name: 'Management (pessary & surgery)' },
            ]},
            { id: 'mbbs-s17-sec24', name: 'GYNAECOLOGY: Infertility', topics: [
                { id: 'mbbs-obg-104', name: 'Causes (male & female factors)' },
                { id: 'mbbs-obg-105', name: 'PCOS' },
                { id: 'mbbs-obg-106', name: 'Evaluation of infertile couple' },
                { id: 'mbbs-obg-107', name: 'Ovulation induction' },
                { id: 'mbbs-obg-108', name: 'Assisted reproductive techniques (IVF basics)' },
            ]},
            { id: 'mbbs-s17-sec25', name: 'GYNAECOLOGY: Contraception & Family Planning', topics: [
                { id: 'mbbs-obg-109', name: 'Natural methods' },
                { id: 'mbbs-obg-110', name: 'OCPs (mechanism, contraindications)' },
                { id: 'mbbs-obg-111', name: 'IUCD (Copper-T)' },
                { id: 'mbbs-obg-112', name: 'Emergency contraception' },
                { id: 'mbbs-obg-113', name: 'Sterilization (Tubectomy)' },
            ]},
            { id: 'mbbs-s17-sec26', name: 'GYNAECOLOGY: Gynecological Malignancies', topics: [
                { id: 'mbbs-obg-114', name: 'Carcinoma Cervix - Risk factors, Screening (Pap smear), Staging, Management' },
                { id: 'mbbs-obg-115', name: 'Carcinoma Endometrium - Risk factors, Postmenopausal bleeding' },
                { id: 'mbbs-obg-116', name: 'Carcinoma Ovary - Clinical features, Staging' },
                { id: 'mbbs-obg-117', name: 'Carcinoma Vulva' },
            ]},
            { id: 'mbbs-s17-sec27', name: 'GYNAECOLOGY: Urogynecology', topics: [
                { id: 'mbbs-obg-118', name: 'Stress urinary incontinence' },
                { id: 'mbbs-obg-119', name: 'Urge incontinence' },
                { id: 'mbbs-obg-120', name: 'Vesicovaginal fistula (VVF)' },
            ]},
            { id: 'mbbs-s17-sec28', name: 'GYNAECOLOGY: Acute Abdomen in Gynecology', topics: [
                { id: 'mbbs-obg-121', name: 'Ectopic pregnancy (overlap with obstetrics but important)' },
                { id: 'mbbs-obg-122', name: 'Torsion ovarian cyst' },
                { id: 'mbbs-obg-123', name: 'Ruptured cyst' },
            ]},
            { id: 'mbbs-s17-sec29', name: 'GYNAECOLOGY: Operative Gynecology', topics: [
                { id: 'mbbs-obg-124', name: 'D&C indications' },
                { id: 'mbbs-obg-125', name: 'Hysterectomy (types & complications)' },
                { id: 'mbbs-obg-126', name: 'Laparoscopy basics' },
                { id: 'mbbs-obg-127', name: 'Myomectomy' },
            ]},
            { id: 'mbbs-s17-sec30', name: 'GYNAECOLOGY: Miscellaneous Important Topics', topics: [
                { id: 'mbbs-obg-128', name: 'PCOS (pathophysiology + management)' },
                { id: 'mbbs-obg-129', name: 'Bartholin cyst' },
                { id: 'mbbs-obg-130', name: 'Vulvovaginitis' },
                { id: 'mbbs-obg-131', name: 'Genital prolapse surgery' },
                { id: 'mbbs-obg-132', name: 'Ethical issues in gynecology' },
            ]},
        ]
    },
    {
        id: 'mbbs-s18', name: 'Anesthesia',
        sections: [
            { id: 'mbbs-s18-sec1', name: 'History & Basics of Anaesthesia', topics: [
                { id: 'mbbs-anes-1', name: 'History of anaesthesia (William T. G. Morton – Ether demonstration)' },
                { id: 'mbbs-anes-2', name: 'Stages of anaesthesia (Guedel)' },
                { id: 'mbbs-anes-3', name: 'Components of balanced anaesthesia' },
                { id: 'mbbs-anes-4', name: 'ASA physical status classification (American Society of Anesthesiologists)' },
            ]},
            { id: 'mbbs-s18-sec2', name: 'Pre-Anaesthetic Evaluation & Premedication', topics: [
                { id: 'mbbs-anes-5', name: 'Pre-anaesthetic check-up (PAC)' },
                { id: 'mbbs-anes-6', name: 'Airway assessment (Mallampati grading)' },
                { id: 'mbbs-anes-7', name: 'Fasting guidelines' },
                { id: 'mbbs-anes-8', name: 'Risk assessment' },
                { id: 'mbbs-anes-9', name: 'Premedication drugs (anticholinergics, benzodiazepines, opioids)' },
                { id: 'mbbs-anes-10', name: 'Informed consent in anaesthesia' },
            ]},
            { id: 'mbbs-s18-sec3', name: 'General Anaesthesia: Inhalational Agents', topics: [
                { id: 'mbbs-anes-11', name: 'Ether, Halothane, Sevoflurane, Isoflurane, Desflurane' },
                { id: 'mbbs-anes-12', name: 'MAC (Minimum Alveolar Concentration)' },
                { id: 'mbbs-anes-13', name: 'Advantages & disadvantages' },
                { id: 'mbbs-anes-14', name: 'Malignant hyperthermia' },
            ]},
            { id: 'mbbs-s18-sec4', name: 'General Anaesthesia: Intravenous Anaesthetics', topics: [
                { id: 'mbbs-anes-15', name: 'Propofol' },
                { id: 'mbbs-anes-16', name: 'Thiopentone' },
                { id: 'mbbs-anes-17', name: 'Ketamine' },
                { id: 'mbbs-anes-18', name: 'Etomidate' },
                { id: 'mbbs-anes-19', name: 'Benzodiazepines (Midazolam)' },
            ]},
            { id: 'mbbs-s18-sec5', name: 'General Anaesthesia: Opioids', topics: [
                { id: 'mbbs-anes-20', name: 'Morphine' },
                { id: 'mbbs-anes-21', name: 'Fentanyl' },
                { id: 'mbbs-anes-22', name: 'Tramadol' },
                { id: 'mbbs-anes-23', name: 'Naloxone (antidote)' },
            ]},
            { id: 'mbbs-s18-sec6', name: 'Muscle Relaxants', topics: [
                { id: 'mbbs-anes-24', name: 'Classification:' },
                { id: 'mbbs-anes-25', name: 'Depolarizing (Succinylcholine)' },
                { id: 'mbbs-anes-26', name: 'Non-depolarizing (Vecuronium, Rocuronium, Atracurium)' },
                { id: 'mbbs-anes-27', name: 'Mechanism of action' },
                { id: 'mbbs-anes-28', name: 'Reversal agents (Neostigmine)' },
                { id: 'mbbs-anes-29', name: 'Complications (Apnoea, Hyperkalemia)' },
            ]},
            { id: 'mbbs-s18-sec7', name: 'Airway Management', topics: [
                { id: 'mbbs-anes-30', name: 'Laryngoscopy' },
                { id: 'mbbs-anes-31', name: 'Endotracheal intubation' },
                { id: 'mbbs-anes-32', name: 'LMA (Laryngeal Mask Airway)' },
                { id: 'mbbs-anes-33', name: 'Difficult airway management' },
                { id: 'mbbs-anes-34', name: 'Rapid sequence intubation' },
                { id: 'mbbs-anes-35', name: 'Cricothyrotomy & Tracheostomy (basics)' },
            ]},
            { id: 'mbbs-s18-sec8', name: 'Regional Anaesthesia', topics: [
                { id: 'mbbs-anes-36', name: 'Spinal anaesthesia' },
                { id: 'mbbs-anes-37', name: 'Epidural anaesthesia' },
                { id: 'mbbs-anes-38', name: 'Caudal anaesthesia' },
                { id: 'mbbs-anes-39', name: 'Nerve blocks' },
                { id: 'mbbs-anes-40', name: 'Complications (Hypotension, PDPH)' },
            ]},
            { id: 'mbbs-s18-sec9', name: 'Local Anaesthetics', topics: [
                { id: 'mbbs-anes-41', name: 'Lignocaine' },
                { id: 'mbbs-anes-42', name: 'Bupivacaine' },
                { id: 'mbbs-anes-43', name: 'Ropivacaine' },
                { id: 'mbbs-anes-44', name: 'Mechanism of action' },
                { id: 'mbbs-anes-45', name: 'Toxicity (LAST – Local Anaesthetic Systemic Toxicity)' },
            ]},
            { id: 'mbbs-s18-sec10', name: 'Monitoring in Anaesthesia', topics: [
                { id: 'mbbs-anes-46', name: 'Pulse oximetry' },
                { id: 'mbbs-anes-47', name: 'Capnography' },
                { id: 'mbbs-anes-48', name: 'ECG monitoring' },
                { id: 'mbbs-anes-49', name: 'Blood pressure monitoring' },
                { id: 'mbbs-anes-50', name: 'Central venous pressure (CVP)' },
                { id: 'mbbs-anes-51', name: 'ETCO₂ interpretation' },
            ]},
            { id: 'mbbs-s18-sec11', name: 'Anaesthesia Machine & Circuits', topics: [
                { id: 'mbbs-anes-52', name: 'Boyle’s machine' },
                { id: 'mbbs-anes-53', name: 'Components of anaesthesia machine' },
                { id: 'mbbs-anes-54', name: 'Oxygen failure safety device' },
                { id: 'mbbs-anes-55', name: 'Breathing circuits (Mapleson system)' },
                { id: 'mbbs-anes-56', name: 'Vaporizers' },
            ]},
            { id: 'mbbs-s18-sec12', name: 'Fluid Management & Blood Transfusion', topics: [
                { id: 'mbbs-anes-57', name: 'Crystalloids vs Colloids' },
                { id: 'mbbs-anes-58', name: 'Indications for blood transfusion' },
                { id: 'mbbs-anes-59', name: 'Massive transfusion protocol' },
                { id: 'mbbs-anes-60', name: 'Complications of transfusion' },
            ]},
            { id: 'mbbs-s18-sec13', name: 'CPR & Resuscitation', topics: [
                { id: 'mbbs-anes-61', name: 'Basic Life Support (BLS)' },
                { id: 'mbbs-anes-62', name: 'Advanced Cardiac Life Support (ACLS)' },
                { id: 'mbbs-anes-63', name: 'Drugs used in CPR (Adrenaline, Atropine, Amiodarone)' },
                { id: 'mbbs-anes-64', name: 'Defibrillation' },
            ]},
            { id: 'mbbs-s18-sec14', name: 'Shock', topics: [
                { id: 'mbbs-anes-65', name: 'Types (Hypovolemic, Septic, Cardiogenic, Anaphylactic)' },
                { id: 'mbbs-anes-66', name: 'Management principles' },
                { id: 'mbbs-anes-67', name: 'Vasopressors (Noradrenaline, Dopamine)' },
            ]},
            { id: 'mbbs-s18-sec15', name: 'Pain Management', topics: [
                { id: 'mbbs-anes-68', name: 'Acute pain management' },
                { id: 'mbbs-anes-69', name: 'Post-operative pain' },
                { id: 'mbbs-anes-70', name: 'WHO pain ladder' },
                { id: 'mbbs-anes-71', name: 'PCA (Patient Controlled Analgesia)' },
            ]},
            { id: 'mbbs-s18-sec16', name: 'Obstetric Anaesthesia', topics: [
                { id: 'mbbs-anes-72', name: 'Anaesthesia for LSCS' },
                { id: 'mbbs-anes-73', name: 'Spinal in pregnancy' },
                { id: 'mbbs-anes-74', name: 'Eclampsia management' },
                { id: 'mbbs-anes-75', name: 'Difficult airway in pregnancy' },
            ]},
            { id: 'mbbs-s18-sec17', name: 'Pediatric & Geriatric Anaesthesia', topics: [
                { id: 'mbbs-anes-76', name: 'Differences in physiology' },
                { id: 'mbbs-anes-77', name: 'Drug dose adjustments' },
                { id: 'mbbs-anes-78', name: 'Special precautions' },
            ]},
            { id: 'mbbs-s18-sec18', name: 'ICU & Critical Care Basics', topics: [
                { id: 'mbbs-anes-79', name: 'Ventilator basics (Modes of ventilation)' },
                { id: 'mbbs-anes-80', name: 'ARDS' },
                { id: 'mbbs-anes-81', name: 'Sedation in ICU' },
                { id: 'mbbs-anes-82', name: 'Sepsis management' },
            ]},
        ]
    },
    {
        id: 'mbbs-s19', name: 'Radiology',
        sections: [
            { id: 'mbbs-s19-sec1', name: 'Basics of Radiology', topics: [
                { id: 'mbbs-rad-1', name: 'X-ray production and properties' },
                { id: 'mbbs-rad-2', name: 'CT scan principles (Hounsfield units)' },
                { id: 'mbbs-rad-3', name: 'MRI principles (T1 vs T2 differences)' },
                { id: 'mbbs-rad-4', name: 'Ultrasound physics (Doppler basics)' },
                { id: 'mbbs-rad-5', name: 'Contrast media (types, indications, adverse reactions)' },
                { id: 'mbbs-rad-6', name: 'Radiation hazards & protection (ALARA principle)' },
                { id: 'mbbs-rad-7', name: 'Imaging modalities – indications & contraindications' },
            ]},
            { id: 'mbbs-s19-sec2', name: 'Respiratory System', topics: [
                { id: 'mbbs-rad-8', name: 'Chest X-ray interpretation (ABCDE approach)' },
                { id: 'mbbs-rad-9', name: 'Pneumonia (lobar, bronchopneumonia)' },
                { id: 'mbbs-rad-10', name: 'Pulmonary tuberculosis (primary & post-primary)' },
                { id: 'mbbs-rad-11', name: 'Pleural effusion & pneumothorax' },
                { id: 'mbbs-rad-12', name: 'Lung collapse (atelectasis)' },
                { id: 'mbbs-rad-13', name: 'Bronchogenic carcinoma' },
                { id: 'mbbs-rad-14', name: 'ARDS' },
                { id: 'mbbs-rad-15', name: 'COVID-19 CT findings (if asked clinically)' },
            ]},
            { id: 'mbbs-s19-sec3', name: 'Cardiovascular System', topics: [
                { id: 'mbbs-rad-16', name: 'Cardiomegaly causes (X-ray)' },
                { id: 'mbbs-rad-17', name: 'Congenital heart diseases (TOF, ASD, VSD)' },
                { id: 'mbbs-rad-18', name: 'Pulmonary edema' },
                { id: 'mbbs-rad-19', name: 'Aortic aneurysm & dissection' },
                { id: 'mbbs-rad-20', name: 'Angiography basics' },
                { id: 'mbbs-rad-21', name: 'Deep vein thrombosis (Doppler)' },
            ]},
            { id: 'mbbs-s19-sec4', name: 'CNS Imaging', topics: [
                { id: 'mbbs-rad-22', name: 'CT in head injury (EDH, SDH, SAH)' },
                { id: 'mbbs-rad-23', name: 'Intracranial tumors' },
                { id: 'mbbs-rad-24', name: 'Stroke (CT vs MRI findings)' },
                { id: 'mbbs-rad-25', name: 'Hydrocephalus' },
                { id: 'mbbs-rad-26', name: 'Meningitis imaging features' },
                { id: 'mbbs-rad-27', name: 'Spine disc prolapse' },
            ]},
            { id: 'mbbs-s19-sec5', name: 'Musculoskeletal System', topics: [
                { id: 'mbbs-rad-28', name: 'Fracture types (Colles, supracondylar, neck of femur)' },
                { id: 'mbbs-rad-29', name: 'Osteomyelitis' },
                { id: 'mbbs-rad-30', name: 'Bone tumors (osteosarcoma, Ewing’s)' },
                { id: 'mbbs-rad-31', name: 'Osteoarthritis & rheumatoid arthritis' },
                { id: 'mbbs-rad-32', name: 'MRI in ligament injuries' },
                { id: 'mbbs-rad-33', name: 'Osteoporosis' },
            ]},
            { id: 'mbbs-s19-sec6', name: 'Gastrointestinal System', topics: [
                { id: 'mbbs-rad-34', name: 'Intestinal obstruction (X-ray findings)' },
                { id: 'mbbs-rad-35', name: 'Perforation (air under diaphragm)' },
                { id: 'mbbs-rad-36', name: 'Barium studies (esophagus, stomach)' },
                { id: 'mbbs-rad-37', name: 'Carcinoma stomach & colon' },
                { id: 'mbbs-rad-38', name: 'Pancreatitis (CT findings)' },
                { id: 'mbbs-rad-39', name: 'Liver cirrhosis & portal hypertension' },
                { id: 'mbbs-rad-40', name: 'Hepatocellular carcinoma' },
            ]},
            { id: 'mbbs-s19-sec7', name: 'Hepatobiliary & Pancreas', topics: [
                { id: 'mbbs-rad-41', name: 'Gallstones (USG findings)' },
                { id: 'mbbs-rad-42', name: 'Acute cholecystitis' },
                { id: 'mbbs-rad-43', name: 'Obstructive jaundice' },
                { id: 'mbbs-rad-44', name: 'ERCP & MRCP basics' },
            ]},
            { id: 'mbbs-s19-sec8', name: 'Genitourinary System', topics: [
                { id: 'mbbs-rad-45', name: 'Renal calculi (X-ray KUB)' },
                { id: 'mbbs-rad-46', name: 'Hydronephrosis' },
                { id: 'mbbs-rad-47', name: 'IVP indications' },
                { id: 'mbbs-rad-48', name: 'Renal tumors' },
                { id: 'mbbs-rad-49', name: 'Polycystic kidney' },
                { id: 'mbbs-rad-50', name: 'Prostate enlargement (USG)' },
            ]},
            { id: 'mbbs-s19-sec9', name: 'Obstetrics & Gynecology', topics: [
                { id: 'mbbs-rad-51', name: 'Early pregnancy USG' },
                { id: 'mbbs-rad-52', name: 'Ectopic pregnancy' },
                { id: 'mbbs-rad-53', name: 'Placenta previa' },
                { id: 'mbbs-rad-54', name: 'Fetal anomalies screening' },
                { id: 'mbbs-rad-55', name: 'Ovarian cyst & tumors' },
                { id: 'mbbs-rad-56', name: 'Fibroids' },
            ]},
            { id: 'mbbs-s19-sec10', name: 'Pediatric Radiology', topics: [
                { id: 'mbbs-rad-57', name: 'RDS (ground glass appearance)' },
                { id: 'mbbs-rad-58', name: 'Hirschsprung disease' },
                { id: 'mbbs-rad-59', name: 'Intussusception' },
                { id: 'mbbs-rad-60', name: 'Congenital diaphragmatic hernia' },
            ]},
            { id: 'mbbs-s19-sec11', name: 'Emergency Radiology', topics: [
                { id: 'mbbs-rad-61', name: 'Trauma imaging (FAST scan)' },
                { id: 'mbbs-rad-62', name: 'Polytrauma protocol' },
                { id: 'mbbs-rad-63', name: 'Tension pneumothorax' },
                { id: 'mbbs-rad-64', name: 'Ruptured spleen' },
            ]},
            { id: 'mbbs-s19-sec12', name: 'Interventional Radiology', topics: [
                { id: 'mbbs-rad-65', name: 'Biopsy guidance' },
                { id: 'mbbs-rad-66', name: 'Drainage procedures' },
                { id: 'mbbs-rad-67', name: 'Angioplasty' },
                { id: 'mbbs-rad-68', name: 'Embolization' },
            ]},
            { id: 'mbbs-s19-sec13', name: 'Viva Questions', topics: [
                { id: 'mbbs-rad-69', name: 'Difference between CT and MRI' },
                { id: 'mbbs-rad-70', name: 'T1 vs T2 images' },
                { id: 'mbbs-rad-71', name: 'Radiological signs (Golden S sign, Water lily sign, Meniscus sign)' },
                { id: 'mbbs-rad-72', name: 'Radiation dose comparison' },
                { id: 'mbbs-rad-73', name: 'Contrast nephropathy' },
            ]},
        ]
    },
    {
        id: 'mbbs-s20', name: 'Emergency Medicine',
        sections: [
            { id: 'mbbs-s20-sec1', name: 'Basics of Emergency Care', topics: [
                { id: 'mbbs-em-1', name: 'Triage (RED, YELLOW, GREEN)' },
                { id: 'mbbs-em-2', name: 'Primary survey (ABCDE approach)' },
                { id: 'mbbs-em-3', name: 'Secondary survey' },
                { id: 'mbbs-em-4', name: 'Basic life support (BLS)' },
                { id: 'mbbs-em-5', name: 'Advanced life support (ALS)' },
                { id: 'mbbs-em-6', name: 'Airway management basics' },
                { id: 'mbbs-em-7', name: 'Oxygen therapy & monitoring' },
            ]},
            { id: 'mbbs-s20-sec2', name: 'Cardiovascular Emergencies', topics: [
                { id: 'mbbs-em-8', name: 'Cardiac arrest & CPR' },
                { id: 'mbbs-em-9', name: 'Acute coronary syndrome (ACS)' },
                { id: 'mbbs-em-10', name: 'Arrhythmias' },
                { id: 'mbbs-em-11', name: 'Shock (hypovolemic, cardiogenic, septic)' },
                { id: 'mbbs-em-12', name: 'Hypertensive emergencies' },
            ]},
            { id: 'mbbs-s20-sec3', name: 'Respiratory Emergencies', topics: [
                { id: 'mbbs-em-13', name: 'Acute asthma & COPD exacerbation' },
                { id: 'mbbs-em-14', name: 'Acute respiratory distress' },
                { id: 'mbbs-em-15', name: 'Pneumothorax' },
                { id: 'mbbs-em-16', name: 'Pulmonary embolism' },
                { id: 'mbbs-em-17', name: 'Airway obstruction' },
            ]},
            { id: 'mbbs-s20-sec4', name: 'Neurological Emergencies', topics: [
                { id: 'mbbs-em-18', name: 'Stroke (FAST approach)' },
                { id: 'mbbs-em-19', name: 'Seizures & status epilepticus' },
                { id: 'mbbs-em-20', name: 'Coma & GCS assessment' },
                { id: 'mbbs-em-21', name: 'Head injury' },
                { id: 'mbbs-em-22', name: 'Meningitis/encephalitis' },
            ]},
            { id: 'mbbs-s20-sec5', name: 'Trauma & Surgical Emergencies', topics: [
                { id: 'mbbs-em-23', name: 'Polytrauma management' },
                { id: 'mbbs-em-24', name: 'Fractures & dislocations' },
                { id: 'mbbs-em-25', name: 'Hemorrhage control' },
                { id: 'mbbs-em-26', name: 'Burns & fluid management' },
                { id: 'mbbs-em-27', name: 'Acute abdomen' },
            ]},
            { id: 'mbbs-s20-sec6', name: 'Toxicology & Poisoning', topics: [
                { id: 'mbbs-em-28', name: 'Organophosphate poisoning' },
                { id: 'mbbs-em-29', name: 'Snake bite & envenomation' },
                { id: 'mbbs-em-30', name: 'Drug overdose' },
                { id: 'mbbs-em-31', name: 'Alcohol intoxication' },
                { id: 'mbbs-em-32', name: 'Antidotes' },
            ]},
            { id: 'mbbs-s20-sec7', name: 'Pediatric Emergencies', topics: [
                { id: 'mbbs-em-33', name: 'Pediatric BLS' },
                { id: 'mbbs-em-34', name: 'Dehydration & shock' },
                { id: 'mbbs-em-35', name: 'Febrile seizures' },
                { id: 'mbbs-em-36', name: 'Neonatal resuscitation' },
            ]},
            { id: 'mbbs-s20-sec8', name: 'Obstetric & Gynecological Emergencies', topics: [
                { id: 'mbbs-em-37', name: 'Eclampsia' },
                { id: 'mbbs-em-38', name: 'Postpartum hemorrhage (PPH)' },
                { id: 'mbbs-em-39', name: 'Ectopic pregnancy' },
                { id: 'mbbs-em-40', name: 'Obstetric trauma' },
            ]},
            { id: 'mbbs-s20-sec9', name: 'Environmental & Misc Emergencies', topics: [
                { id: 'mbbs-em-41', name: 'Heat stroke / hypothermia' },
                { id: 'mbbs-em-42', name: 'Anaphylaxis' },
                { id: 'mbbs-em-43', name: 'Electrocution' },
                { id: 'mbbs-em-44', name: 'Drowning' },
            ]},
            { id: 'mbbs-s20-sec10', name: 'Emergency Procedures (Skills)', topics: [
                { id: 'mbbs-em-45', name: 'IV access & fluid therapy' },
                { id: 'mbbs-em-46', name: 'Endotracheal intubation (basic understanding)' },
                { id: 'mbbs-em-47', name: 'NG tube, Foley catheter' },
                { id: 'mbbs-em-48', name: 'Wound suturing' },
                { id: 'mbbs-em-49', name: 'Basic ultrasound (FAST)' },
            ]},
        ]
    },
];

// ========== BDS Full Curriculum ==========
const bdsSubjects: Subject[] = [
    {
        id: 'bds-s1', name: 'General Human Anatomy including Embryology, Osteology & Histology',
        sections: [
            { id: 'bds-s1-sec1', name: 'Gross Anatomy', topics: [
                { id: 'bds-t1', name: 'Anatomical terminology' },
                { id: 'bds-t2', name: 'Cell structure' },
                { id: 'bds-t3', name: 'Tissue classification' },
                { id: 'bds-t4', name: 'Musculoskeletal system' },
                { id: 'bds-t5', name: 'Osteology of skull' },
                { id: 'bds-t6', name: 'Osteology of mandible' },
                { id: 'bds-t7', name: 'Maxilla anatomy' },
                { id: 'bds-t8', name: 'Temporomandibular joint' },
                { id: 'bds-t9', name: 'Muscles of mastication' },
                { id: 'bds-t10', name: 'Muscles of facial expression' },
            ]},
            { id: 'bds-s1-sec2', name: 'Head and Neck Anatomy', topics: [
                { id: 'bds-t11', name: 'Cranial nerves' },
                { id: 'bds-t12', name: 'Blood supply of head & neck' },
                { id: 'bds-t13', name: 'Lymphatic drainage' },
                { id: 'bds-t14', name: 'Salivary glands anatomy' },
                { id: 'bds-t15', name: 'Pharynx and larynx' },
                { id: 'bds-t16', name: 'Nasal cavity and sinuses' },
            ]},
            { id: 'bds-s1-sec3', name: 'Embryology', topics: [
                { id: 'bds-t17', name: 'Development of face' },
                { id: 'bds-t18', name: 'Development of palate' },
                { id: 'bds-t19', name: 'Development of tooth' },
                { id: 'bds-t20', name: 'Pharyngeal arches' },
                { id: 'bds-t21', name: 'Developmental anomalies' },
            ]},
            { id: 'bds-s1-sec4', name: 'Histology', topics: [
                { id: 'bds-t22', name: 'Oral mucosa histology' },
                { id: 'bds-t23', name: 'Enamel histology' },
                { id: 'bds-t24', name: 'Dentin histology' },
                { id: 'bds-t25', name: 'Cementum histology' },
                { id: 'bds-t26', name: 'Pulp histology' },
                { id: 'bds-t27', name: 'Salivary gland histology' },
            ]},
        ]
    },
    {
        id: 'bds-s2', name: 'General Physiology',
        sections: [
            { id: 'bds-s2-sec1', name: 'General Physiology', topics: [
                { id: 'bds-t28', name: 'Cell physiology' },
                { id: 'bds-t29', name: 'Membrane transport' },
                { id: 'bds-t30', name: 'Body fluids and homeostasis' },
                { id: 'bds-t31', name: 'Blood physiology' },
                { id: 'bds-t32', name: 'Hemostasis and coagulation' },
                { id: 'bds-t33', name: 'Nerve impulse transmission' },
                { id: 'bds-t34', name: 'Muscle physiology' },
                { id: 'bds-t35', name: 'Cardiovascular system' },
                { id: 'bds-t36', name: 'Cardiac cycle' },
                { id: 'bds-t37', name: 'Blood pressure regulation' },
                { id: 'bds-t38', name: 'Respiratory physiology' },
                { id: 'bds-t39', name: 'Lung volumes' },
                { id: 'bds-t40', name: 'Gastrointestinal physiology' },
                { id: 'bds-t41', name: 'Liver physiology' },
                { id: 'bds-t42', name: 'Renal physiology' },
                { id: 'bds-t43', name: 'Acid-base balance' },
                { id: 'bds-t44', name: 'Endocrinology' },
                { id: 'bds-t45', name: 'Reproductive physiology' },
            ]},
        ]
    },
    {
        id: 'bds-s3', name: 'Biochemistry, Nutrition and Dietetics',
        sections: [
            { id: 'bds-s3-sec1', name: 'Molecular Biochemistry', topics: [
                { id: 'bds-t46', name: 'Structure of proteins' },
                { id: 'bds-t47', name: 'Enzymes' },
                { id: 'bds-t48', name: 'DNA structure' },
                { id: 'bds-t49', name: 'RNA structure' },
                { id: 'bds-t50', name: 'Gene expression' },
            ]},
            { id: 'bds-s3-sec2', name: 'Metabolism', topics: [
                { id: 'bds-t51', name: 'Carbohydrate metabolism' },
                { id: 'bds-t52', name: 'Lipid metabolism' },
                { id: 'bds-t53', name: 'Amino acid metabolism' },
                { id: 'bds-t54', name: 'Energy metabolism' },
            ]},
            { id: 'bds-s3-sec3', name: 'Nutrition', topics: [
                { id: 'bds-t55', name: 'Balanced diet' },
                { id: 'bds-t56', name: 'Vitamins' },
                { id: 'bds-t57', name: 'Minerals' },
                { id: 'bds-t58', name: 'Nutritional deficiencies' },
                { id: 'bds-t59', name: 'Diet planning' },
                { id: 'bds-t60', name: 'Obesity' },
                { id: 'bds-t61', name: 'Malnutrition' },
            ]},
            { id: 'bds-s3-sec4', name: 'Dental Relevance', topics: [
                { id: 'bds-t62', name: 'Biochemistry of saliva' },
                { id: 'bds-t63', name: 'Biochemical basis of dental caries' },
                { id: 'bds-t64', name: 'Calcium metabolism' },
            ]},
        ]
    },
    {
        id: 'bds-s4', name: 'Dental Anatomy, Embryology and Oral Histology',
        sections: [
            { id: 'bds-s4-sec1', name: 'Dental Anatomy, Embryology and Oral Histology', topics: [
                { id: 'bds-t65', name: 'Tooth morphology' },
                { id: 'bds-t66', name: 'Tooth numbering systems' },
                { id: 'bds-t67', name: 'Dentitions' },
                { id: 'bds-t68', name: 'Occlusion concepts' },
                { id: 'bds-t69', name: 'Dental arches' },
                { id: 'bds-t70', name: 'Enamel structure' },
                { id: 'bds-t71', name: 'Dentin structure' },
                { id: 'bds-t72', name: 'Cementum' },
                { id: 'bds-t73', name: 'Pulp morphology' },
                { id: 'bds-t74', name: 'Tooth eruption chronology' },
                { id: 'bds-t75', name: 'Development of oral cavity' },
                { id: 'bds-t76', name: 'Histology of oral tissues' },
            ]},
        ]
    },
    {
        id: 'bds-s5', name: 'General Pathology',
        sections: [
            { id: 'bds-s5-sec1', name: 'General Pathology', topics: [
                { id: 'bds-t77', name: 'Cell injury' },
                { id: 'bds-t78', name: 'Degeneration' },
                { id: 'bds-t79', name: 'Necrosis' },
                { id: 'bds-t80', name: 'Apoptosis' },
                { id: 'bds-t81', name: 'Acute inflammation' },
                { id: 'bds-t82', name: 'Chronic inflammation' },
                { id: 'bds-t83', name: 'Healing and repair' },
                { id: 'bds-t84', name: 'Hemodynamic disorders' },
                { id: 'bds-t85', name: 'Thrombosis' },
                { id: 'bds-t86', name: 'Embolism' },
                { id: 'bds-t87', name: 'Shock' },
                { id: 'bds-t88', name: 'Neoplasia' },
                { id: 'bds-t89', name: 'Immunopathology' },
                { id: 'bds-t90', name: 'Genetic diseases' },
            ]},
        ]
    },
    {
        id: 'bds-s6', name: 'Microbiology',
        sections: [
            { id: 'bds-s6-sec1', name: 'Microbiology', topics: [
                { id: 'bds-t91', name: 'Bacterial morphology' },
                { id: 'bds-t92', name: 'Culture techniques' },
                { id: 'bds-t93', name: 'Sterilization' },
                { id: 'bds-t94', name: 'Disinfection' },
                { id: 'bds-t95', name: 'Immunology basics' },
                { id: 'bds-t96', name: 'Hypersensitivity' },
                { id: 'bds-t97', name: 'Oral microbiology' },
                { id: 'bds-t98', name: 'Dental plaque microbiology' },
                { id: 'bds-t99', name: 'Cariogenic bacteria' },
                { id: 'bds-t100', name: 'Periodontal pathogens' },
                { id: 'bds-t101', name: 'Virology' },
                { id: 'bds-t102', name: 'Mycology' },
            ]},
        ]
    },
    {
        id: 'bds-s7', name: 'General and Dental Pharmacology and Therapeutics',
        sections: [
            { id: 'bds-s7-sec1', name: 'Pharmacology and Therapeutics', topics: [
                { id: 'bds-t103', name: 'Pharmacokinetics' },
                { id: 'bds-t104', name: 'Pharmacodynamics' },
                { id: 'bds-t105', name: 'Drug metabolism' },
                { id: 'bds-t106', name: 'Drug interactions' },
                { id: 'bds-t107', name: 'Antibiotics' },
                { id: 'bds-t108', name: 'Analgesics' },
                { id: 'bds-t109', name: 'NSAIDs' },
                { id: 'bds-t110', name: 'Local anesthetics' },
                { id: 'bds-t111', name: 'Sedatives' },
                { id: 'bds-t112', name: 'Antiseptics' },
                { id: 'bds-t113', name: 'Emergency drugs' },
                { id: 'bds-t114', name: 'Prescription writing' },
                { id: 'bds-t115', name: 'Adverse drug reactions' },
            ]},
        ]
    },
    {
        id: 'bds-s8', name: 'Dental Materials',
        sections: [
            { id: 'bds-s8-sec1', name: 'Dental Materials', topics: [
                { id: 'bds-t116', name: 'Physical properties' },
                { id: 'bds-t117', name: 'Mechanical properties' },
                { id: 'bds-t118', name: 'Impression materials' },
                { id: 'bds-t119', name: 'Gypsum products' },
                { id: 'bds-t120', name: 'Dental wax' },
                { id: 'bds-t121', name: 'Dental amalgam' },
                { id: 'bds-t122', name: 'Composite resins' },
                { id: 'bds-t123', name: 'Glass ionomer cement' },
                { id: 'bds-t124', name: 'Dental ceramics' },
                { id: 'bds-t125', name: 'Casting alloys' },
                { id: 'bds-t126', name: 'Implant materials' },
                { id: 'bds-t127', name: 'Biocompatibility' },
            ]},
        ]
    },
    {
        id: 'bds-s9', name: 'Preclinical Prosthodontics and Crown & Bridge',
        sections: [
            { id: 'bds-s9-sec1', name: 'Preclinical Prosthodontics', topics: [
                { id: 'bds-t128', name: 'Complete dentures' },
                { id: 'bds-t129', name: 'Partial dentures' },
                { id: 'bds-t130', name: 'Articulators' },
                { id: 'bds-t131', name: 'Occlusion' },
                { id: 'bds-t132', name: 'Tooth preparation' },
                { id: 'bds-t133', name: 'Impression techniques' },
                { id: 'bds-t134', name: 'Bite registration' },
                { id: 'bds-t135', name: 'Wax patterns' },
                { id: 'bds-t136', name: 'Crown preparation' },
                { id: 'bds-t137', name: 'Bridge design' },
            ]},
        ]
    },
    {
        id: 'bds-s10', name: 'Preclinical Conservative Dentistry',
        sections: [
            { id: 'bds-s10-sec1', name: 'Preclinical Conservative Dentistry', topics: [
                { id: 'bds-t138', name: 'Cavity preparation' },
                { id: 'bds-t139', name: 'G V Black classification' },
                { id: 'bds-t140', name: 'Hand instruments' },
                { id: 'bds-t141', name: 'Dental burs' },
                { id: 'bds-t142', name: 'Isolation techniques' },
                { id: 'bds-t143', name: 'Matrix systems' },
                { id: 'bds-t144', name: 'Restorative materials' },
                { id: 'bds-t145', name: 'Pulp protection' },
                { id: 'bds-t146', name: 'Caries removal' },
            ]},
        ]
    },
    {
        id: 'bds-s11', name: 'General Medicine',
        sections: [
            { id: 'bds-s11-sec1', name: 'General Medicine', topics: [
                { id: 'bds-t147', name: 'Cardiovascular diseases' },
                { id: 'bds-t148', name: 'Hypertension' },
                { id: 'bds-t149', name: 'Diabetes mellitus' },
                { id: 'bds-t150', name: 'Thyroid disorders' },
                { id: 'bds-t151', name: 'Respiratory diseases' },
                { id: 'bds-t152', name: 'Tuberculosis' },
                { id: 'bds-t153', name: 'Liver diseases' },
                { id: 'bds-t154', name: 'Renal diseases' },
                { id: 'bds-t155', name: 'Neurological disorders' },
                { id: 'bds-t156', name: 'Hematological disorders' },
                { id: 'bds-t157', name: 'Infectious diseases' },
                { id: 'bds-t158', name: 'Medical emergencies' },
            ]},
        ]
    },
    {
        id: 'bds-s12', name: 'General Surgery',
        sections: [
            { id: 'bds-s12-sec1', name: 'General Surgery', topics: [
                { id: 'bds-t159', name: 'Wound healing' },
                { id: 'bds-t160', name: 'Shock' },
                { id: 'bds-t161', name: 'Trauma' },
                { id: 'bds-t162', name: 'Hemorrhage' },
                { id: 'bds-t163', name: 'Surgical infections' },
                { id: 'bds-t164', name: 'Tumors' },
                { id: 'bds-t165', name: 'Cysts' },
                { id: 'bds-t166', name: 'Biopsy' },
                { id: 'bds-t167', name: 'Suturing' },
                { id: 'bds-t168', name: 'Anesthesia basics' },
            ]},
        ]
    },
    {
        id: 'bds-s13', name: 'Oral and Maxillofacial Pathology & Oral Microbiology',
        sections: [
            { id: 'bds-s13-sec1', name: 'Oral and Maxillofacial Pathology', topics: [
                { id: 'bds-t169', name: 'Developmental anomalies' },
                { id: 'bds-t170', name: 'Dental caries pathology' },
                { id: 'bds-t171', name: 'Pulpal pathology' },
                { id: 'bds-t172', name: 'Periapical pathology' },
                { id: 'bds-t173', name: 'Cysts of oral cavity' },
                { id: 'bds-t174', name: 'Tumors' },
                { id: 'bds-t175', name: 'Salivary gland diseases' },
                { id: 'bds-t176', name: 'Bone pathology' },
                { id: 'bds-t177', name: 'Oral infections' },
                { id: 'bds-t178', name: 'Potentially malignant disorders' },
                { id: 'bds-t179', name: 'Oral cancer' },
            ]},
        ]
    },
    {
        id: 'bds-s14', name: 'Oral Medicine and Radiology',
        sections: [
            { id: 'bds-s14-sec1', name: 'Oral Medicine and Radiology', topics: [
                { id: 'bds-t180', name: 'Case history taking' },
                { id: 'bds-t181', name: 'Clinical examination' },
                { id: 'bds-t182', name: 'Radiographic techniques' },
                { id: 'bds-t183', name: 'Intraoral radiography' },
                { id: 'bds-t184', name: 'Extraoral radiography' },
                { id: 'bds-t185', name: 'OPG interpretation' },
                { id: 'bds-t186', name: 'Oral mucosal lesions' },
                { id: 'bds-t187', name: 'TMJ disorders' },
                { id: 'bds-t188', name: 'Oral manifestations of systemic diseases' },
                { id: 'bds-t189', name: 'Potentially malignant disorders' },
            ]},
        ]
    },
    {
        id: 'bds-s15', name: 'Oral & Maxillofacial Surgery',
        sections: [
            { id: 'bds-s15-sec1', name: 'Oral & Maxillofacial Surgery', topics: [
                { id: 'bds-t190', name: 'Extraction techniques' },
                { id: 'bds-t191', name: 'Impaction management' },
                { id: 'bds-t192', name: 'Minor oral surgery' },
                { id: 'bds-t193', name: 'Jaw fractures' },
                { id: 'bds-t194', name: 'Cysts surgery' },
                { id: 'bds-t195', name: 'Tumor surgery' },
                { id: 'bds-t196', name: 'Infection management' },
                { id: 'bds-t197', name: 'Preprosthetic surgery' },
                { id: 'bds-t198', name: 'Surgical anatomy' },
            ]},
        ]
    },
    {
        id: 'bds-s16', name: 'Periodontology',
        sections: [
            { id: 'bds-s16-sec1', name: 'Periodontology', topics: [
                { id: 'bds-t199', name: 'Gingiva anatomy' },
                { id: 'bds-t200', name: 'Dental plaque' },
                { id: 'bds-t201', name: 'Calculus' },
                { id: 'bds-t202', name: 'Gingivitis' },
                { id: 'bds-t203', name: 'Periodontitis' },
                { id: 'bds-t204', name: 'Periodontal pocket' },
                { id: 'bds-t205', name: 'Scaling' },
                { id: 'bds-t206', name: 'Root planing' },
                { id: 'bds-t207', name: 'Periodontal surgery' },
                { id: 'bds-t208', name: 'Regeneration' },
            ]},
        ]
    },
    {
        id: 'bds-s17', name: 'Pediatric and Preventive Dentistry',
        sections: [
            { id: 'bds-s17-sec1', name: 'Pediatric and Preventive Dentistry', topics: [
                { id: 'bds-t209', name: 'Growth and development' },
                { id: 'bds-t210', name: 'Child psychology' },
                { id: 'bds-t211', name: 'Behavior management' },
                { id: 'bds-t212', name: 'Fluoride therapy' },
                { id: 'bds-t213', name: 'Pit and fissure sealants' },
                { id: 'bds-t214', name: 'Pulp therapy' },
                { id: 'bds-t215', name: 'Space maintainers' },
                { id: 'bds-t216', name: 'Preventive dentistry' },
            ]},
        ]
    },
    {
        id: 'bds-s18', name: 'Conservative Dentistry and Endodontics',
        sections: [
            { id: 'bds-s18-sec1', name: 'Conservative Dentistry and Endodontics', topics: [
                { id: 'bds-t217', name: 'Dental caries' },
                { id: 'bds-t218', name: 'Adhesive dentistry' },
                { id: 'bds-t219', name: 'Composite restorations' },
                { id: 'bds-t220', name: 'Minimal intervention dentistry' },
                { id: 'bds-t221', name: 'Root canal treatment' },
                { id: 'bds-t222', name: 'Endodontic instruments' },
                { id: 'bds-t223', name: 'Irrigants' },
                { id: 'bds-t224', name: 'Obturation techniques' },
                { id: 'bds-t225', name: 'Periapical lesions' },
            ]},
        ]
    },
    {
        id: 'bds-s19', name: 'Prosthodontics and Crown & Bridge',
        sections: [
            { id: 'bds-s19-sec1', name: 'Prosthodontics and Crown & Bridge', topics: [
                { id: 'bds-t226', name: 'Complete dentures' },
                { id: 'bds-t227', name: 'Partial dentures' },
                { id: 'bds-t228', name: 'Fixed prosthodontics' },
                { id: 'bds-t229', name: 'Impression materials' },
                { id: 'bds-t230', name: 'Occlusion' },
                { id: 'bds-t231', name: 'Maxillofacial prosthesis' },
                { id: 'bds-t232', name: 'Implant prosthodontics' },
            ]},
        ]
    },
    {
        id: 'bds-s20', name: 'Orthodontics & Dentofacial Orthopaedics',
        sections: [
            { id: 'bds-s20-sec1', name: 'Orthodontics & Dentofacial Orthopaedics', topics: [
                { id: 'bds-t233', name: 'Growth of jaws' },
                { id: 'bds-t234', name: 'Malocclusion classification' },
                { id: 'bds-t235', name: 'Cephalometrics' },
                { id: 'bds-t236', name: 'Orthodontic appliances' },
                { id: 'bds-t237', name: 'Functional appliances' },
                { id: 'bds-t238', name: 'Diagnosis' },
                { id: 'bds-t239', name: 'Treatment planning' },
            ]},
        ]
    },
    {
        id: 'bds-s21', name: 'Public Health Dentistry',
        sections: [
            { id: 'bds-s21-sec1', name: 'Public Health Dentistry', topics: [
                { id: 'bds-t240', name: 'Epidemiology' },
                { id: 'bds-t241', name: 'Indices in dentistry' },
                { id: 'bds-t242', name: 'Survey methods' },
                { id: 'bds-t243', name: 'Biostatistics basics' },
                { id: 'bds-t244', name: 'Health education' },
                { id: 'bds-t245', name: 'Dental public health programs' },
                { id: 'bds-t246', name: 'Water fluoridation' },
            ]},
        ]
    },
    {
        id: 'bds-s22', name: 'Dental Armamentarium and Usage',
        sections: [
            { id: 'bds-s22-sec1', name: 'Dental Armamentarium', topics: [
                { id: 'bds-t247', name: 'Classification of instruments' },
                { id: 'bds-t248', name: 'Rotary instruments' },
                { id: 'bds-t249', name: 'Hand instruments' },
                { id: 'bds-t250', name: 'Dental chair components' },
            ]},
        ]
    },
    {
        id: 'bds-s23', name: 'Sterilization & Disinfection',
        sections: [
            { id: 'bds-s23-sec1', name: 'Sterilization & Disinfection', topics: [
                { id: 'bds-t251', name: 'Autoclave' },
                { id: 'bds-t252', name: 'Dry heat' },
                { id: 'bds-t253', name: 'Chemical sterilization' },
                { id: 'bds-t254', name: 'Biomedical waste management' },
                { id: 'bds-t255', name: 'Universal precautions' },
            ]},
        ]
    },
    {
        id: 'bds-s24', name: 'Behavioural Sciences',
        sections: [
            { id: 'bds-s24-sec1', name: 'Behavioural Sciences', topics: [
                { id: 'bds-t256', name: 'Communication skills' },
                { id: 'bds-t257', name: 'Patient psychology' },
                { id: 'bds-t258', name: 'Anxiety management' },
                { id: 'bds-t259', name: 'Doctor-patient relationship' },
            ]},
        ]
    },
    {
        id: 'bds-s25', name: 'Ethics',
        sections: [
            { id: 'bds-s25-sec1', name: 'Ethics', topics: [
                { id: 'bds-t260', name: 'Professional ethics' },
                { id: 'bds-t261', name: 'Consent' },
                { id: 'bds-t262', name: 'Confidentiality' },
                { id: 'bds-t263', name: 'Legal responsibilities' },
            ]},
        ]
    },
    {
        id: 'bds-s26', name: 'Cariology',
        sections: [
            { id: 'bds-s26-sec1', name: 'Cariology', topics: [
                { id: 'bds-t264', name: 'Etiology of caries' },
                { id: 'bds-t265', name: 'Demineralization' },
                { id: 'bds-t266', name: 'Remineralization' },
                { id: 'bds-t267', name: 'Caries prevention' },
            ]},
        ]
    },
    {
        id: 'bds-s27', name: 'Pulpoperiapical Lesions',
        sections: [
            { id: 'bds-s27-sec1', name: 'Pulpoperiapical Lesions', topics: [
                { id: 'bds-t268', name: 'Reversible pulpitis' },
                { id: 'bds-t269', name: 'Irreversible pulpitis' },
                { id: 'bds-t270', name: 'Periapical abscess' },
                { id: 'bds-t271', name: 'Periapical cyst' },
                { id: 'bds-t272', name: 'Periapical granuloma' },
            ]},
        ]
    },
    {
        id: 'bds-s28', name: 'Diagnosis & Treatment Planning',
        sections: [
            { id: 'bds-s28-sec1', name: 'Diagnosis & Treatment Planning', topics: [
                { id: 'bds-t273', name: 'Clinical examination' },
                { id: 'bds-t274', name: 'Radiographic interpretation' },
                { id: 'bds-t275', name: 'Treatment sequencing' },
                { id: 'bds-t276', name: 'Prognosis' },
            ]},
        ]
    },
    {
        id: 'bds-s29', name: 'Aesthetic Dentistry',
        sections: [
            { id: 'bds-s29-sec1', name: 'Aesthetic Dentistry', topics: [
                { id: 'bds-t277', name: 'Smile design' },
                { id: 'bds-t278', name: 'Veneers' },
                { id: 'bds-t279', name: 'Tooth whitening' },
                { id: 'bds-t280', name: 'Cosmetic restorations' },
            ]},
        ]
    },
    {
        id: 'bds-s30', name: 'Forensic Odontology',
        sections: [
            { id: 'bds-s30-sec1', name: 'Forensic Odontology', topics: [
                { id: 'bds-t281', name: 'Age estimation' },
                { id: 'bds-t282', name: 'Bite mark analysis' },
                { id: 'bds-t283', name: 'Dental identification' },
                { id: 'bds-t284', name: 'DNA from teeth' },
            ]},
        ]
    },
    {
        id: 'bds-s31', name: 'Implantology',
        sections: [
            { id: 'bds-s31-sec1', name: 'Implantology', topics: [
                { id: 'bds-t285', name: 'Implant types' },
                { id: 'bds-t286', name: 'Osseointegration' },
                { id: 'bds-t287', name: 'Implant planning' },
                { id: 'bds-t288', name: 'Surgical placement' },
                { id: 'bds-t289', name: 'Prosthetic loading' },
            ]},
        ]
    },
];

// ========== BSc Nursing Full Curriculum ==========
const bscNursingSubjects: Subject[] = [
    {
        id: 'nrs-s1', name: 'Applied Anatomy',
        sections: [
            { id: 'nrs-s1-sec1', name: 'Applied Anatomy', topics: [
                { id: 'nrs-t1', name: 'Introduction to human body organization' },
                { id: 'nrs-t2', name: 'Cell structure and function' },
                { id: 'nrs-t3', name: 'Tissues of the body' },
                { id: 'nrs-t4', name: 'Integumentary system' },
                { id: 'nrs-t5', name: 'Skeletal system' },
                { id: 'nrs-t6', name: 'Muscular system' },
                { id: 'nrs-t7', name: 'Nervous system' },
                { id: 'nrs-t8', name: 'Special senses (eye, ear)' },
                { id: 'nrs-t9', name: 'Cardiovascular system' },
                { id: 'nrs-t10', name: 'Respiratory system' },
                { id: 'nrs-t11', name: 'Digestive system' },
                { id: 'nrs-t12', name: 'Urinary system' },
                { id: 'nrs-t13', name: 'Reproductive system' },
                { id: 'nrs-t14', name: 'Endocrine system' },
                { id: 'nrs-t15', name: 'Lymphatic and immune system' },
                { id: 'nrs-t16', name: 'Anatomical terminology and planes' },
                { id: 'nrs-t17', name: 'Applied anatomy in nursing procedures' },
                { id: 'nrs-t18', name: 'Surface anatomy landmarks' },
            ]},
        ]
    },
    {
        id: 'nrs-s2', name: 'Applied Physiology',
        sections: [
            { id: 'nrs-s2-sec1', name: 'Applied Physiology', topics: [
                { id: 'nrs-t19', name: 'Homeostasis' },
                { id: 'nrs-t20', name: 'Cell physiology' },
                { id: 'nrs-t21', name: 'Blood physiology' },
                { id: 'nrs-t22', name: 'Cardiovascular physiology' },
                { id: 'nrs-t23', name: 'Respiratory physiology' },
                { id: 'nrs-t24', name: 'Digestive physiology' },
                { id: 'nrs-t25', name: 'Renal physiology' },
                { id: 'nrs-t26', name: 'Nervous system physiology' },
                { id: 'nrs-t27', name: 'Endocrine physiology' },
                { id: 'nrs-t28', name: 'Reproductive physiology' },
                { id: 'nrs-t29', name: 'Fluid and electrolyte balance' },
                { id: 'nrs-t30', name: 'Acid base balance' },
                { id: 'nrs-t31', name: 'Temperature regulation' },
                { id: 'nrs-t32', name: 'Muscle physiology' },
                { id: 'nrs-t33', name: 'Immune response' },
                { id: 'nrs-t34', name: 'Pain physiology' },
                { id: 'nrs-t35', name: 'Shock physiology' },
                { id: 'nrs-t36', name: 'Stress response' },
            ]},
        ]
    },
    {
        id: 'nrs-s3', name: 'Applied Sociology',
        sections: [
            { id: 'nrs-s3-sec1', name: 'Applied Sociology', topics: [
                { id: 'nrs-t37', name: 'Introduction to sociology' },
                { id: 'nrs-t38', name: 'Social structure and social system' },
                { id: 'nrs-t39', name: 'Family structure in India' },
                { id: 'nrs-t40', name: 'Culture and health practices' },
                { id: 'nrs-t41', name: 'Social stratification' },
                { id: 'nrs-t42', name: 'Urban and rural community structure' },
                { id: 'nrs-t43', name: 'Social problems affecting health' },
                { id: 'nrs-t44', name: 'Poverty and health' },
                { id: 'nrs-t45', name: 'Gender issues in healthcare' },
                { id: 'nrs-t46', name: 'Population explosion' },
                { id: 'nrs-t47', name: 'Community resources' },
                { id: 'nrs-t48', name: 'Social change and modernization' },
                { id: 'nrs-t49', name: 'Health disparities' },
                { id: 'nrs-t50', name: 'Role of nurse in society' },
                { id: 'nrs-t51', name: 'Sociology in patient care' },
                { id: 'nrs-t52', name: 'Communication patterns in society' },
            ]},
        ]
    },
    {
        id: 'nrs-s4', name: 'Applied Psychology',
        sections: [
            { id: 'nrs-s4-sec1', name: 'Applied Psychology', topics: [
                { id: 'nrs-t53', name: 'Introduction to psychology' },
                { id: 'nrs-t54', name: 'Learning theories' },
                { id: 'nrs-t55', name: 'Memory and forgetting' },
                { id: 'nrs-t56', name: 'Intelligence theories' },
                { id: 'nrs-t57', name: 'Personality development' },
                { id: 'nrs-t58', name: 'Motivation theories' },
                { id: 'nrs-t59', name: 'Emotions and stress' },
                { id: 'nrs-t60', name: 'Psychological needs of patients' },
                { id: 'nrs-t61', name: 'Coping mechanisms' },
                { id: 'nrs-t62', name: 'Behaviour modification' },
                { id: 'nrs-t63', name: 'Mental health concepts' },
                { id: 'nrs-t64', name: 'Adjustment disorders' },
                { id: 'nrs-t65', name: 'Developmental psychology' },
                { id: 'nrs-t66', name: 'Psychological assessment' },
                { id: 'nrs-t67', name: 'Nurse patient relationship' },
                { id: 'nrs-t68', name: 'Communication skills' },
            ]},
        ]
    },
    {
        id: 'nrs-s5', name: 'Applied Biochemistry',
        sections: [
            { id: 'nrs-s5-sec1', name: 'Applied Biochemistry', topics: [
                { id: 'nrs-t69', name: 'Structure of cell and biomolecules' },
                { id: 'nrs-t70', name: 'Carbohydrate metabolism' },
                { id: 'nrs-t71', name: 'Protein metabolism' },
                { id: 'nrs-t72', name: 'Lipid metabolism' },
                { id: 'nrs-t73', name: 'Enzymes' },
                { id: 'nrs-t74', name: 'Vitamins' },
                { id: 'nrs-t75', name: 'Minerals' },
                { id: 'nrs-t76', name: 'Hormones biochemical functions' },
                { id: 'nrs-t77', name: 'Acid base balance' },
                { id: 'nrs-t78', name: 'Water metabolism' },
                { id: 'nrs-t79', name: 'Nutrition biochemistry' },
                { id: 'nrs-t80', name: 'Clinical enzymology' },
                { id: 'nrs-t81', name: 'Liver function tests' },
                { id: 'nrs-t82', name: 'Kidney function tests' },
                { id: 'nrs-t83', name: 'Metabolic disorders' },
                { id: 'nrs-t84', name: 'Diabetes mellitus biochemistry' },
                { id: 'nrs-t85', name: 'Genetic disorders biochemical basis' },
            ]},
        ]
    },
    {
        id: 'nrs-s6', name: 'Applied Nutrition & Dietetics',
        sections: [
            { id: 'nrs-s6-sec1', name: 'Applied Nutrition & Dietetics', topics: [
                { id: 'nrs-t86', name: 'Principles of nutrition' },
                { id: 'nrs-t87', name: 'Food groups' },
                { id: 'nrs-t88', name: 'Balanced diet' },
                { id: 'nrs-t89', name: 'Nutritional assessment' },
                { id: 'nrs-t90', name: 'Therapeutic diet' },
                { id: 'nrs-t91', name: 'Diet in diabetes' },
                { id: 'nrs-t92', name: 'Diet in hypertension' },
                { id: 'nrs-t93', name: 'Diet in renal diseases' },
                { id: 'nrs-t94', name: 'Diet in liver diseases' },
                { id: 'nrs-t95', name: 'Diet in pregnancy' },
                { id: 'nrs-t96', name: 'Infant nutrition' },
                { id: 'nrs-t97', name: 'Malnutrition' },
                { id: 'nrs-t98', name: 'Obesity management' },
                { id: 'nrs-t99', name: 'Enteral nutrition' },
                { id: 'nrs-t100', name: 'Parenteral nutrition' },
                { id: 'nrs-t101', name: 'Food hygiene' },
                { id: 'nrs-t102', name: 'National nutrition programs' },
            ]},
        ]
    },
    {
        id: 'nrs-s7', name: 'Nursing Foundations I',
        sections: [
            { id: 'nrs-s7-sec1', name: 'Nursing Foundations I', topics: [
                { id: 'nrs-t103', name: 'Concept of nursing' },
                { id: 'nrs-t104', name: 'Nursing process' },
                { id: 'nrs-t105', name: 'Health and illness concepts' },
                { id: 'nrs-t106', name: 'Infection control basics' },
                { id: 'nrs-t107', name: 'Vital signs monitoring' },
                { id: 'nrs-t108', name: 'Personal hygiene' },
                { id: 'nrs-t109', name: 'Bed making' },
                { id: 'nrs-t110', name: 'Positioning and mobility' },
                { id: 'nrs-t111', name: 'Patient comfort measures' },
                { id: 'nrs-t112', name: 'Safety measures in hospital' },
                { id: 'nrs-t113', name: 'Admission and discharge procedure' },
                { id: 'nrs-t114', name: 'Documentation in nursing' },
                { id: 'nrs-t115', name: 'Communication skills' },
                { id: 'nrs-t116', name: 'Ethical principles' },
                { id: 'nrs-t117', name: 'First aid basics' },
                { id: 'nrs-t118', name: 'Nursing assessment techniques' },
                { id: 'nrs-t119', name: 'Body mechanics' },
            ]},
        ]
    },
    {
        id: 'nrs-s8', name: 'Nursing Foundations II',
        sections: [
            { id: 'nrs-s8-sec1', name: 'Nursing Foundations II', topics: [
                { id: 'nrs-t120', name: 'Medication administration principles' },
                { id: 'nrs-t121', name: 'IV therapy basics' },
                { id: 'nrs-t122', name: 'Wound care' },
                { id: 'nrs-t123', name: 'Oxygen therapy' },
                { id: 'nrs-t124', name: 'Catheterization' },
                { id: 'nrs-t125', name: 'Nasogastric tube feeding' },
                { id: 'nrs-t126', name: 'Fluid balance monitoring' },
                { id: 'nrs-t127', name: 'Pain management' },
                { id: 'nrs-t128', name: 'Infection prevention' },
                { id: 'nrs-t129', name: 'Surgical asepsis' },
                { id: 'nrs-t130', name: 'Specimen collection' },
                { id: 'nrs-t131', name: 'Preoperative care' },
                { id: 'nrs-t132', name: 'Postoperative care' },
                { id: 'nrs-t133', name: 'Emergency nursing basics' },
                { id: 'nrs-t134', name: 'BCLS concepts' },
                { id: 'nrs-t135', name: 'Patient education methods' },
            ]},
        ]
    },
    {
        id: 'nrs-s9', name: 'Applied Microbiology & Infection Control including Safety',
        sections: [
            { id: 'nrs-s9-sec1', name: 'Microbiology & Infection Control', topics: [
                { id: 'nrs-t136', name: 'Introduction to microbiology' },
                { id: 'nrs-t137', name: 'Bacteria classification' },
                { id: 'nrs-t138', name: 'Viruses' },
                { id: 'nrs-t139', name: 'Fungi' },
                { id: 'nrs-t140', name: 'Parasites' },
                { id: 'nrs-t141', name: 'Chain of infection' },
                { id: 'nrs-t142', name: 'Sterilization methods' },
                { id: 'nrs-t143', name: 'Disinfection methods' },
                { id: 'nrs-t144', name: 'Hospital acquired infections' },
                { id: 'nrs-t145', name: 'Biomedical waste management' },
                { id: 'nrs-t146', name: 'Personal protective equipment' },
                { id: 'nrs-t147', name: 'Standard precautions' },
                { id: 'nrs-t148', name: 'Antimicrobial resistance' },
                { id: 'nrs-t149', name: 'Vaccination basics' },
                { id: 'nrs-t150', name: 'Specimen collection methods' },
                { id: 'nrs-t151', name: 'Infection surveillance' },
                { id: 'nrs-t152', name: 'Occupational hazards' },
                { id: 'nrs-t153', name: 'Needle stick injury prevention' },
            ]},
        ]
    },
    {
        id: 'nrs-s10', name: 'Adult Health Nursing (Medical Surgical Nursing) I',
        sections: [
            { id: 'nrs-s10-sec1', name: 'Medical Surgical Nursing I', topics: [
                { id: 'nrs-t154', name: 'Nursing care of patients with respiratory disorders' },
                { id: 'nrs-t155', name: 'Cardiovascular disorders' },
                { id: 'nrs-t156', name: 'Gastrointestinal disorders' },
                { id: 'nrs-t157', name: 'Renal disorders' },
                { id: 'nrs-t158', name: 'Neurological disorders' },
                { id: 'nrs-t159', name: 'Musculoskeletal disorders' },
                { id: 'nrs-t160', name: 'Fluid electrolyte imbalance' },
                { id: 'nrs-t161', name: 'Shock management' },
                { id: 'nrs-t162', name: 'Pain management' },
                { id: 'nrs-t163', name: 'Preoperative care' },
                { id: 'nrs-t164', name: 'Postoperative care' },
                { id: 'nrs-t165', name: 'Emergency nursing' },
                { id: 'nrs-t166', name: 'Oncology nursing basics' },
                { id: 'nrs-t167', name: 'ICU nursing basics' },
                { id: 'nrs-t168', name: 'Burns management' },
                { id: 'nrs-t169', name: 'Nursing assessment techniques' },
            ]},
        ]
    },
    {
        id: 'nrs-s11', name: 'Adult Health Nursing II',
        sections: [
            { id: 'nrs-s11-sec1', name: 'Adult Health Nursing II', topics: [
                { id: 'nrs-t170', name: 'Geriatric nursing care' },
                { id: 'nrs-t171', name: 'Endocrine disorders' },
                { id: 'nrs-t172', name: 'Immunological disorders' },
                { id: 'nrs-t173', name: 'Dermatological disorders' },
                { id: 'nrs-t174', name: 'Hematological disorders' },
                { id: 'nrs-t175', name: 'Communicable diseases' },
                { id: 'nrs-t176', name: 'Non communicable diseases' },
                { id: 'nrs-t177', name: 'Rehabilitation nursing' },
                { id: 'nrs-t178', name: 'Palliative care' },
                { id: 'nrs-t179', name: 'Critical care nursing' },
                { id: 'nrs-t180', name: 'Perioperative nursing' },
                { id: 'nrs-t181', name: 'Pain clinics' },
                { id: 'nrs-t182', name: 'Organ transplantation nursing' },
            ]},
        ]
    },
    {
        id: 'nrs-s12', name: 'Pharmacology I & II',
        sections: [
            { id: 'nrs-s12-sec1', name: 'Pharmacology', topics: [
                { id: 'nrs-t183', name: 'General pharmacology' },
                { id: 'nrs-t184', name: 'Pharmacokinetics' },
                { id: 'nrs-t185', name: 'Pharmacodynamics' },
                { id: 'nrs-t186', name: 'Drug dosage calculations' },
                { id: 'nrs-t187', name: 'Routes of drug administration' },
                { id: 'nrs-t188', name: 'Antibiotics' },
                { id: 'nrs-t189', name: 'Antihypertensives' },
                { id: 'nrs-t190', name: 'Antidiabetic drugs' },
                { id: 'nrs-t191', name: 'Analgesics' },
                { id: 'nrs-t192', name: 'Anesthetics' },
                { id: 'nrs-t193', name: 'CNS drugs' },
                { id: 'nrs-t194', name: 'Cardiovascular drugs' },
                { id: 'nrs-t195', name: 'Respiratory drugs' },
                { id: 'nrs-t196', name: 'Gastrointestinal drugs' },
                { id: 'nrs-t197', name: 'Emergency drugs' },
                { id: 'nrs-t198', name: 'Chemotherapy drugs' },
                { id: 'nrs-t199', name: 'Drug interactions' },
                { id: 'nrs-t200', name: 'Adverse drug reactions' },
            ]},
        ]
    },
    {
        id: 'nrs-s13', name: 'Pathology I & II',
        sections: [
            { id: 'nrs-s13-sec1', name: 'Pathology', topics: [
                { id: 'nrs-t201', name: 'Cell injury' },
                { id: 'nrs-t202', name: 'Inflammation' },
                { id: 'nrs-t203', name: 'Infection pathology' },
                { id: 'nrs-t204', name: 'Neoplasia' },
                { id: 'nrs-t205', name: 'Hemodynamic disorders' },
                { id: 'nrs-t206', name: 'Genetic disorders' },
                { id: 'nrs-t207', name: 'Hematology basics' },
                { id: 'nrs-t208', name: 'Immunopathology' },
                { id: 'nrs-t209', name: 'Organ pathology' },
                { id: 'nrs-t210', name: 'Blood disorders' },
                { id: 'nrs-t211', name: 'Tumor markers' },
                { id: 'nrs-t212', name: 'Diagnostic pathology' },
                { id: 'nrs-t213', name: 'Cytology' },
                { id: 'nrs-t214', name: 'Biopsy interpretation basics' },
            ]},
        ]
    },
    {
        id: 'nrs-s14', name: 'Genetics',
        sections: [
            { id: 'nrs-s14-sec1', name: 'Genetics', topics: [
                { id: 'nrs-t215', name: 'Basic genetics concepts' },
                { id: 'nrs-t216', name: 'DNA structure' },
                { id: 'nrs-t217', name: 'Chromosomes' },
                { id: 'nrs-t218', name: 'Mendelian inheritance' },
                { id: 'nrs-t219', name: 'Genetic disorders' },
                { id: 'nrs-t220', name: 'Genetic counseling' },
                { id: 'nrs-t221', name: 'Prenatal diagnosis' },
                { id: 'nrs-t222', name: 'Genetic screening' },
                { id: 'nrs-t223', name: 'Congenital anomalies' },
                { id: 'nrs-t224', name: 'Ethical issues in genetics' },
            ]},
        ]
    },
    {
        id: 'nrs-s15', name: 'Educational Technology / Nursing Education',
        sections: [
            { id: 'nrs-s15-sec1', name: 'Nursing Education', topics: [
                { id: 'nrs-t225', name: 'Teaching learning principles' },
                { id: 'nrs-t226', name: 'Lesson planning' },
                { id: 'nrs-t227', name: 'Teaching methods' },
                { id: 'nrs-t228', name: 'Audio visual aids' },
                { id: 'nrs-t229', name: 'Simulation based learning' },
                { id: 'nrs-t230', name: 'OSCE concepts' },
                { id: 'nrs-t231', name: 'Assessment methods' },
                { id: 'nrs-t232', name: 'Curriculum planning' },
                { id: 'nrs-t233', name: 'E learning in nursing' },
                { id: 'nrs-t234', name: 'Micro teaching' },
                { id: 'nrs-t235', name: 'Evaluation tools' },
                { id: 'nrs-t236', name: 'Feedback techniques' },
                { id: 'nrs-t237', name: 'Educational objectives' },
            ]},
        ]
    },
    {
        id: 'nrs-s16', name: 'Nursing Management & Leadership',
        sections: [
            { id: 'nrs-s16-sec1', name: 'Nursing Management & Leadership', topics: [
                { id: 'nrs-t238', name: 'Management principles' },
                { id: 'nrs-t239', name: 'Leadership styles' },
                { id: 'nrs-t240', name: 'Staffing patterns' },
                { id: 'nrs-t241', name: 'Supervision' },
                { id: 'nrs-t242', name: 'Conflict management' },
                { id: 'nrs-t243', name: 'Quality assurance' },
                { id: 'nrs-t244', name: 'Hospital administration' },
                { id: 'nrs-t245', name: 'Budget planning' },
                { id: 'nrs-t246', name: 'Nursing audit' },
                { id: 'nrs-t247', name: 'Performance appraisal' },
                { id: 'nrs-t248', name: 'Material management' },
                { id: 'nrs-t249', name: 'Team building' },
                { id: 'nrs-t250', name: 'Legal issues in management' },
            ]},
        ]
    },
    {
        id: 'nrs-s17', name: 'Nursing Research & Statistics',
        sections: [
            { id: 'nrs-s17-sec1', name: 'Nursing Research & Statistics', topics: [
                { id: 'nrs-t251', name: 'Research process' },
                { id: 'nrs-t252', name: 'Research design' },
                { id: 'nrs-t253', name: 'Sampling methods' },
                { id: 'nrs-t254', name: 'Data collection methods' },
                { id: 'nrs-t255', name: 'Biostatistics basics' },
                { id: 'nrs-t256', name: 'Hypothesis testing' },
                { id: 'nrs-t257', name: 'Research ethics' },
                { id: 'nrs-t258', name: 'Literature review' },
                { id: 'nrs-t259', name: 'Evidence based practice' },
                { id: 'nrs-t260', name: 'Research proposal writing' },
                { id: 'nrs-t261', name: 'Data analysis basics' },
                { id: 'nrs-t262', name: 'Interpretation of results' },
            ]},
        ]
    },
    {
        id: 'nrs-s18', name: 'Child Health Nursing I & II',
        sections: [
            { id: 'nrs-s18-sec1', name: 'Child Health Nursing', topics: [
                { id: 'nrs-t263', name: 'Growth and development' },
                { id: 'nrs-t264', name: 'Neonatal care' },
                { id: 'nrs-t265', name: 'Pediatric assessment' },
                { id: 'nrs-t266', name: 'Immunization schedule' },
                { id: 'nrs-t267', name: 'Common childhood diseases' },
                { id: 'nrs-t268', name: 'Pediatric emergencies' },
                { id: 'nrs-t269', name: 'Nutritional disorders' },
                { id: 'nrs-t270', name: 'IMNCI guidelines' },
                { id: 'nrs-t271', name: 'Developmental disorders' },
                { id: 'nrs-t272', name: 'Pediatric drug dosage' },
                { id: 'nrs-t273', name: 'Newborn care' },
                { id: 'nrs-t274', name: 'Pediatric ICU basics' },
            ]},
        ]
    },
    {
        id: 'nrs-s19', name: 'Mental Health Nursing I & II',
        sections: [
            { id: 'nrs-s19-sec1', name: 'Mental Health Nursing', topics: [
                { id: 'nrs-t275', name: 'Mental health concepts' },
                { id: 'nrs-t276', name: 'Psychiatric assessment' },
                { id: 'nrs-t277', name: 'Schizophrenia' },
                { id: 'nrs-t278', name: 'Depression' },
                { id: 'nrs-t279', name: 'Anxiety disorders' },
                { id: 'nrs-t280', name: 'Bipolar disorder' },
                { id: 'nrs-t281', name: 'Substance abuse' },
                { id: 'nrs-t282', name: 'Personality disorders' },
                { id: 'nrs-t283', name: 'Psychiatric therapies' },
                { id: 'nrs-t284', name: 'Counseling techniques' },
                { id: 'nrs-t285', name: 'Crisis intervention' },
                { id: 'nrs-t286', name: 'Community mental health' },
            ]},
        ]
    },
    {
        id: 'nrs-s20', name: 'Community Health Nursing I & II',
        sections: [
            { id: 'nrs-s20-sec1', name: 'Community Health Nursing', topics: [
                { id: 'nrs-t287', name: 'Concepts of community health' },
                { id: 'nrs-t288', name: 'Epidemiology basics' },
                { id: 'nrs-t289', name: 'National health programs' },
                { id: 'nrs-t290', name: 'Family health nursing' },
                { id: 'nrs-t291', name: 'Health education methods' },
                { id: 'nrs-t292', name: 'Environmental health' },
                { id: 'nrs-t293', name: 'Occupational health' },
                { id: 'nrs-t294', name: 'School health services' },
                { id: 'nrs-t295', name: 'Maternal and child health programs' },
                { id: 'nrs-t296', name: 'Demography' },
                { id: 'nrs-t297', name: 'Health surveys' },
                { id: 'nrs-t298', name: 'Primary health care' },
                { id: 'nrs-t299', name: 'Disease prevention strategies' },
            ]},
        ]
    },
    {
        id: 'nrs-s21', name: 'Midwifery / OBG Nursing I & II',
        sections: [
            { id: 'nrs-s21-sec1', name: 'Midwifery & OBG Nursing', topics: [
                { id: 'nrs-t300', name: 'Female reproductive system' },
                { id: 'nrs-t301', name: 'Antenatal care' },
                { id: 'nrs-t302', name: 'Intranatal care' },
                { id: 'nrs-t303', name: 'Postnatal care' },
                { id: 'nrs-t304', name: 'Normal labour' },
                { id: 'nrs-t305', name: 'Complicated labour' },
                { id: 'nrs-t306', name: 'Obstetric emergencies' },
                { id: 'nrs-t307', name: 'Newborn assessment' },
                { id: 'nrs-t308', name: 'Family planning' },
                { id: 'nrs-t309', name: 'Gynecological disorders' },
                { id: 'nrs-t310', name: 'Infertility' },
                { id: 'nrs-t311', name: 'Menstrual disorders' },
                { id: 'nrs-t312', name: 'Reproductive health programs' },
            ]},
        ]
    },
];

export type Course = { id: string, name: string, subjects: Subject[], lmsNotesStructure: LMSNotesStructureItem[] };

interface CurriculumState {
    coursesList: Course[];
    setCoursesList: (updater: Course[] | ((prev: Course[]) => Course[])) => void;
}

export const useCurriculumStore = create<CurriculumState>()(
    persist(
        (set) => ({
            coursesList: [
                { id: 'c1', name: 'MBBS', subjects: [...mbbsSubjects], lmsNotesStructure: [...defaultLMSStructure] },
                { id: 'c2', name: 'BDS', subjects: [...bdsSubjects], lmsNotesStructure: [...defaultLMSStructure] },
                { id: 'c3', name: 'BSc Nursing', subjects: [...bscNursingSubjects], lmsNotesStructure: [...defaultLMSStructure] }
            ],
            setCoursesList: (updater) => set((state) => ({
                coursesList: typeof updater === 'function' ? updater(state.coursesList) : updater
            })),
        }),
        {
            name: 'curriculum-storage', // key in local storage
            version: 25, // bump to trigger MBBS detailed Emergency Medicine topics migration
            migrate: (persistedState: any, version: number) => {
                if (version === 0 && persistedState.coursesList) {
                    persistedState.coursesList.forEach((course: any) => {
                        if (course.lmsNotesStructure) {
                            course.lmsNotesStructure.forEach((item: any) => {
                                if (item.id === 'l9' && item.title === 'Flashcards' && item.description === 'Select No') {
                                    item.description = 'Number of flashcards';
                                }
                                if (item.id === 'l10' && item.title === 'PPT' && item.description === 'Select No') {
                                    item.description = 'Number of slides required.';
                                }
                            });
                        }
                    });
                }
                if ((version === 0 || version === 1) && persistedState.coursesList) {
                    const hasNursing = persistedState.coursesList.some((c: any) => c.id === 'c3' || c.name === 'BSc Nursing');
                    if (!hasNursing) {
                        persistedState.coursesList.push({ id: 'c3', name: 'BSc Nursing', subjects: [], lmsNotesStructure: [...defaultLMSStructure] });
                    }
                }
                // Version 2 → 3: Populate BDS subjects
                if (version < 3 && persistedState.coursesList) {
                    const bdsCourse = persistedState.coursesList.find((c: any) => c.id === 'c2' || c.name === 'BDS');
                    if (bdsCourse && (!bdsCourse.subjects || bdsCourse.subjects.length === 0)) {
                        bdsCourse.subjects = [...bdsSubjects];
                    }
                }
                // Version 3 → 4: Populate BSc Nursing subjects
                if (version < 4 && persistedState.coursesList) {
                    const nursingCourse = persistedState.coursesList.find((c: any) => c.id === 'c3' || c.name === 'BSc Nursing');
                    if (nursingCourse && (!nursingCourse.subjects || nursingCourse.subjects.length === 0)) {
                        nursingCourse.subjects = [...bscNursingSubjects];
                    }
                }
                // Version 4 → 5: Populate MBBS subjects
                if (version < 5 && persistedState.coursesList) {
                    const mbbsCourse = persistedState.coursesList.find((c: any) => c.id === 'c1' || c.name === 'MBBS');
                    if (mbbsCourse) {
                        mbbsCourse.subjects = [...mbbsSubjects];
                    }
                }
                // Version 5 → 6: Populate MBBS detailed Anatomy subjects
                if (version < 6 && persistedState.coursesList) {
                    const mbbsCourse = persistedState.coursesList.find((c: any) => c.id === 'c1' || c.name === 'MBBS');
                    if (mbbsCourse) {
                        mbbsCourse.subjects = [...mbbsSubjects];
                    }
                }
                // Version 6 → 7: Populate MBBS detailed Physiology subjects
                if (version < 7 && persistedState.coursesList) {
                    const mbbsCourse = persistedState.coursesList.find((c: any) => c.id === 'c1' || c.name === 'MBBS');
                    if (mbbsCourse) {
                        mbbsCourse.subjects = [...mbbsSubjects];
                    }
                }
                // Version 7 → 8: Populate MBBS detailed Biochemistry subjects
                if (version < 8 && persistedState.coursesList) {
                    const mbbsCourse = persistedState.coursesList.find((c: any) => c.id === 'c1' || c.name === 'MBBS');
                    if (mbbsCourse) {
                        mbbsCourse.subjects = [...mbbsSubjects];
                    }
                }
                // Version 8 → 9: Populate MBBS detailed Pathology subjects
                if (version < 9 && persistedState.coursesList) {
                    const mbbsCourse = persistedState.coursesList.find((c: any) => c.id === 'c1' || c.name === 'MBBS');
                    if (mbbsCourse) {
                        mbbsCourse.subjects = [...mbbsSubjects];
                    }
                }
                // Version 9 → 10: Populate MBBS detailed Microbiology subjects
                if (version < 10 && persistedState.coursesList) {
                    const mbbsCourse = persistedState.coursesList.find((c: any) => c.id === 'c1' || c.name === 'MBBS');
                    if (mbbsCourse) {
                        mbbsCourse.subjects = [...mbbsSubjects];
                    }
                }
                // Version 10 → 11: Populate MBBS detailed Pharmacology subjects
                if (version < 11 && persistedState.coursesList) {
                    const mbbsCourse = persistedState.coursesList.find((c: any) => c.id === 'c1' || c.name === 'MBBS');
                    if (mbbsCourse) {
                        mbbsCourse.subjects = [...mbbsSubjects];
                    }
                }
                // Version 11 → 12: Populate MBBS detailed FMT subjects
                if (version < 12 && persistedState.coursesList) {
                    const mbbsCourse = persistedState.coursesList.find((c: any) => c.id === 'c1' || c.name === 'MBBS');
                    if (mbbsCourse) {
                        mbbsCourse.subjects = [...mbbsSubjects];
                    }
                }
                // Version 12 → 13: Populate MBBS detailed Community Medicine subjects
                if (version < 13 && persistedState.coursesList) {
                    const mbbsCourse = persistedState.coursesList.find((c: any) => c.id === 'c1' || c.name === 'MBBS');
                    if (mbbsCourse) {
                        mbbsCourse.subjects = [...mbbsSubjects];
                    }
                }
                // Version 13 → 14: Populate MBBS detailed Ophthalmology subjects
                if (version < 14 && persistedState.coursesList) {
                    const mbbsCourse = persistedState.coursesList.find((c: any) => c.id === 'c1' || c.name === 'MBBS');
                    if (mbbsCourse) {
                        mbbsCourse.subjects = [...mbbsSubjects];
                    }
                }
                // Version 14 → 15: Populate MBBS detailed ENT subjects
                if (version < 15 && persistedState.coursesList) {
                    const mbbsCourse = persistedState.coursesList.find((c: any) => c.id === 'c1' || c.name === 'MBBS');
                    if (mbbsCourse) {
                        mbbsCourse.subjects = [...mbbsSubjects];
                    }
                }
                // Version 15 → 16: Populate MBBS detailed General Medicine subjects
                if (version < 16 && persistedState.coursesList) {
                    const mbbsCourse = persistedState.coursesList.find((c: any) => c.id === 'c1' || c.name === 'MBBS');
                    if (mbbsCourse) {
                        mbbsCourse.subjects = [...mbbsSubjects];
                    }
                }
                // Version 16 → 17: Populate MBBS detailed Pediatrics subjects
                if (version < 17 && persistedState.coursesList) {
                    const mbbsCourse = persistedState.coursesList.find((c: any) => c.id === 'c1' || c.name === 'MBBS');
                    if (mbbsCourse) {
                        mbbsCourse.subjects = [...mbbsSubjects];
                    }
                }
                // Version 17 → 18: Populate MBBS detailed Dermatology subjects
                if (version < 18 && persistedState.coursesList) {
                    const mbbsCourse = persistedState.coursesList.find((c: any) => c.id === 'c1' || c.name === 'MBBS');
                    if (mbbsCourse) {
                        mbbsCourse.subjects = [...mbbsSubjects];
                    }
                }
                // Version 18 → 19: Populate MBBS detailed Psychiatry subjects
                if (version < 19 && persistedState.coursesList) {
                    const mbbsCourse = persistedState.coursesList.find((c: any) => c.id === 'c1' || c.name === 'MBBS');
                    if (mbbsCourse) {
                        mbbsCourse.subjects = [...mbbsSubjects];
                    }
                }
                // Version 19 → 20: Populate MBBS detailed General Surgery subjects
                if (version < 20 && persistedState.coursesList) {
                    const mbbsCourse = persistedState.coursesList.find((c: any) => c.id === 'c1' || c.name === 'MBBS');
                    if (mbbsCourse) {
                        mbbsCourse.subjects = [...mbbsSubjects];
                    }
                }
                // Version 20 → 21: Populate MBBS detailed Orthopedics subjects
                if (version < 21 && persistedState.coursesList) {
                    const mbbsCourse = persistedState.coursesList.find((c: any) => c.id === 'c1' || c.name === 'MBBS');
                    if (mbbsCourse) {
                        mbbsCourse.subjects = [...mbbsSubjects];
                    }
                }
                // Version 21 → 22: Populate MBBS detailed OBG subjects
                if (version < 22 && persistedState.coursesList) {
                    const mbbsCourse = persistedState.coursesList.find((c: any) => c.id === 'c1' || c.name === 'MBBS');
                    if (mbbsCourse) {
                        mbbsCourse.subjects = [...mbbsSubjects];
                    }
                }
                // Version 22 → 23: Populate MBBS detailed Anesthesia subjects
                if (version < 23 && persistedState.coursesList) {
                    const mbbsCourse = persistedState.coursesList.find((c: any) => c.id === 'c1' || c.name === 'MBBS');
                    if (mbbsCourse) {
                        mbbsCourse.subjects = [...mbbsSubjects];
                    }
                }
                // Version 23 → 24: Populate MBBS detailed Radiology subjects
                if (version < 24 && persistedState.coursesList) {
                    const mbbsCourse = persistedState.coursesList.find((c: any) => c.id === 'c1' || c.name === 'MBBS');
                    if (mbbsCourse) {
                        mbbsCourse.subjects = [...mbbsSubjects];
                    }
                }
                // Version 24 → 25: Populate MBBS detailed Emergency Medicine subjects
                if (version < 25 && persistedState.coursesList) {
                    const mbbsCourse = persistedState.coursesList.find((c: any) => c.id === 'c1' || c.name === 'MBBS');
                    if (mbbsCourse) {
                        mbbsCourse.subjects = [...mbbsSubjects];
                    }
                }
                return persistedState;
            }
        }
    )
);
