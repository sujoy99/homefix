import { ServiceAddress } from './job.types';

export type CreateJobDTO = {
  category_id: string;
  description: string;
  service_address: ServiceAddress;
  title?: string;
  media_urls?: string[];
  service_lat?: number;
  service_lon?: number;
  estimated_budget?: number;
  square_footage?: number;
};
