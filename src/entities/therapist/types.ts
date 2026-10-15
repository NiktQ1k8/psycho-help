export type TTherapist = {
  id: string;
  experience: string;
  qualification: string;
  consult_areas: string;
  description: string;
  office: string;
  education: string;
  short_description: string;
  first_name: string;
  photo: string | null;
  middle_name: string | null;
  last_name: string;
  phone_number: string;
};

export type TTherapistListParams = {
  skip?: number;
  take?: number;
};
