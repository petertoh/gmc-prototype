export const baseProjectFields = groq`
  _id,
  title,
  "slug": slug.current,
  dates{
    dateFormat,
    startYear,
    endYear,
    onGoing,
    startTime,
    endTime
  },
  media[]{
    asset->{
      _id,
      url,
      metadata{
        dimensions{
          width,
          height
        }
      }
    }
  },
  description,
  workForm[]->{
    _id,
    name,
    "slug": slug.current
  },
  medium[]->{
    _id,
    name,
    "slug": slug.current
  },
  dimensions
`
