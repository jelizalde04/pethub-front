interface PetHubLogoProps {
  size?: number;
  className?: string;
}

export const PetHubLogo = ({ size = 48, className = "fill-white" }: PetHubLogoProps) => {
  return (
    <svg
      height={size}
      width={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      {/* Paw pad */}
      <ellipse cx="12" cy="16" rx="3" ry="2.5" />
      {/* Toe pads */}
      <ellipse cx="8" cy="12" rx="1.5" ry="2" />
      <ellipse cx="12" cy="10" rx="1.5" ry="2" />
      <ellipse cx="16" cy="12" rx="1.5" ry="2" />
      <ellipse cx="6.5" cy="14.5" rx="1" ry="1.5" />
    </svg>
  );
};