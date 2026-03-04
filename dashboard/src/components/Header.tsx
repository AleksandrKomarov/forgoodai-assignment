import DateRangeSelector from "./DateRangeSelector";

export default function Header({ title }: { title: string }) {
  return (
    <div className="header">
      <h1>{title}</h1>
      <div className="header-right">
        <DateRangeSelector />
        <div className="avatar">AK</div>
      </div>
    </div>
  );
}
