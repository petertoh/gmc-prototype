// import { baseProjectFields } from '~/assets/groq/baseProjectFields'
// import { personFields } from '~/assets/groq/personFields'
import { defineQuery } from 'groq'

export const projectsNetworkQuery = defineQuery(`{
    "categories": *[_type == "category"]{
      _id,
      _type,
      name,
      "slug": slug.current,
      description,
      image{
        asset->{
          _id,
          url,
          metadata{
            dimensions{
              width,
              height
            }
          }
        },
        caption
      }
    },
    "projects": *[_type == "project"]{    
      _id,
      _type,
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
        },
        caption
      },
      description,
      workForm[]->{
        _id,
        _type,
        name,
        "slug": slug.current,
        description
      },
      medium[]->{
        _id,
        _type,
        name,
        "slug": slug.current
      },
      dimensions,
      category[]->{
        _key,
        _type,
        name,
        "slug": slug.current
      },
      works[]->{
        _key,
        _id,
        _type,
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
          },
          caption
        },
        description,
        workForm[]->{
          _id,
          _type,
          name,
          "slug": slug.current,
          description
        },
        medium[]->{
          _id,
          _type,
          name,
          "slug": slug.current
        },
        dimensions,

      related[]->{
        _key,
        _id,
        _type,
        title,
        "slug": slug.current,
        eventType,
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
          },
          caption
        },
        description,
        workForm[]->{
            _id,
            _type,
            name,
            "slug": slug.current,
            description
          },
          medium[]->{
            _id,
            _type,
            name,
            "slug": slug.current
          },
          dimensions,
          artist[]->{
            _key,
            _type,
            name,
            "slug": slug.current,
            role,
            bio
          }
        }
      },
      related[]->{
        _key,
        _id,
        _type,
        title,
        "slug": slug.current,
        eventType,
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
          },
          caption
        },
        description,
        workForm[]->{
          _id,
          _type,
          name,
          "slug": slug.current,
          description
        },
        medium[]->{
          _id,
          _type,
          name,
          "slug": slug.current
        },
        dimensions,
        artist[]->{
          _key,
          _type,
          name,
          "slug": slug.current,
          role,
          bio
        }
      }
    }
  }`)
