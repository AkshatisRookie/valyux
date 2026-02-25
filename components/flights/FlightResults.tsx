import React from 'react';
import FlightCard from './FlightCard';
import type { FlightResult } from './types';

interface Props {
  results: FlightResult[];
}

const FlightResults: React.FC<Props> = ({ results }) => (
  <div className="space-y-3">
    {results.map((flight, i) => (
      <FlightCard key={flight.id} flight={flight} index={i} />
    ))}
  </div>
);

export default FlightResults;
