export default function FieldInfo({
  isTouched,
  errors,
}: {
  isTouched: boolean;
  errors: any[];
}) {
  if (!isTouched || !errors || errors.length === 0) {
    return null;
  }

  const error = errors[0];
  const errorMessage =
    typeof error === "string" ? error : error?.message || JSON.stringify(error);
  return (
    <>
      {isTouched && errors.length ? ( 
        <p className="text-red-400 text-sm mt-1">{errorMessage}</p>
      ) : null}
    </>
  );
}