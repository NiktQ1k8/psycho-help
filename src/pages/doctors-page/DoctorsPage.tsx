import { useQuery } from '@tanstack/react-query';
import { Result } from 'antd';
import { therapistQueries } from '@/entities/therapist/queries';
import DoctorList from '@/features/therapists/ui/doctor-list';
import Title from '@/features/therapists/ui/title';
import Loader from '@/shared/ui/loader/loader';

const DoctorsPage = () => {
  const { data: doctors, isLoading, error } = useQuery(therapistQueries.list());

  if (isLoading) {
    return (
      <div>
        <Loader />
      </div>
    );
  }
  if (!doctors || error) {
    return (
      <div>
        <Result status={'error'} title={error?.message} />
      </div>
    );
  }

  return (
    <>
      <Title />
      <DoctorList doctors={doctors} />
    </>
  );
};

export default DoctorsPage;
