import { CardParticipants, Companion } from '@/types';

interface Props {
  participants?: CardParticipants;
  companions: Companion[];
}

export default function ParticipantsBadge({ participants, companions }: Props) {
  if (!participants) return null;

  const names = participants.participantIds.map(id => {
    const c = companions.find(c => c.id === id);
    return c ? `${c.age}${c.gender}` : `#${id}`;
  });

  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
        👥 {names.join(', ')} ({participants.totalPeople}명)
      </span>
      {participants.absentNote && (
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {participants.absentNote}
        </span>
      )}
    </div>
  );
}
